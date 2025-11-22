import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES = {
  "prod_TTHC3h7eK0PPbF": { name: "Standard", price: 29 },
  "prod_TTHDn12y4fsfxN": { name: "Advanced", price: 79 },
  "prod_TTHDpODFYYL6lU": { name: "Pro", price: 149 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get current month start
    const now = new Date();
    const monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);

    // Fetch active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    // Fetch canceled subscriptions from this month
    const canceledSubscriptions = await stripe.subscriptions.list({
      status: "canceled",
      limit: 100,
    });

    // Filter cancellations to this month only
    const thisMonthCancellations = canceledSubscriptions.data.filter(
      (sub: Stripe.Subscription) => sub.canceled_at && sub.canceled_at >= monthStart
    );

    // Calculate metrics
    const totalCancellations = thisMonthCancellations.length;
    const activeSubscribers = activeSubscriptions.data.length;
    const totalSubscribersAtStart = activeSubscribers + totalCancellations;
    const monthlyChurnRate = totalSubscribersAtStart > 0 
      ? (totalCancellations / totalSubscribersAtStart) * 100 
      : 0;
    const retentionRate = 100 - monthlyChurnRate;

    // Group cancellations by plan
    const cancellationsByPlan: { [key: string]: number } = {};
    for (const sub of thisMonthCancellations) {
      const productId = sub.items.data[0]?.price.product as string;
      const planInfo = PLAN_PRICES[productId as keyof typeof PLAN_PRICES];
      const planName = planInfo?.name || "Unknown";
      
      cancellationsByPlan[planName] = (cancellationsByPlan[planName] || 0) + 1;
    }

    const cancellationsByPlanArray = Object.entries(cancellationsByPlan).map(([plan, count]) => ({
      plan,
      count,
    }));

    // Extract cancellation reasons from metadata
    const cancellationReasons: { [key: string]: number } = {};
    for (const sub of thisMonthCancellations) {
      const reason = sub.cancellation_details?.reason || sub.metadata?.cancellation_reason || "Not specified";
      cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1;
    }

    const cancellationReasonsArray = Object.entries(cancellationReasons).map(([reason, count]) => ({
      reason,
      count,
    }));

    // Calculate churn trend (last 6 months)
    const churnTrend: { month: string; churnRate: number; cancellations: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthStartTimestamp = Math.floor(date.getTime() / 1000);
      const monthEndTimestamp = Math.floor(new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime() / 1000);

      // Count cancellations for this month
      const monthCancellations = canceledSubscriptions.data.filter(
        (sub: Stripe.Subscription) => sub.canceled_at && sub.canceled_at >= monthStartTimestamp && sub.canceled_at <= monthEndTimestamp
      ).length;

      // Estimate churn rate (simplified for demo)
      const estimatedChurnRate = totalSubscribersAtStart > 0 
        ? (monthCancellations / totalSubscribersAtStart) * 100 
        : 0;

      churnTrend.push({
        month: monthStr,
        churnRate: estimatedChurnRate,
        cancellations: monthCancellations,
      });
    }

    // Calculate LTV trend (simplified)
    const lifetimeValueTrend: { month: string; ltv: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Calculate average LTV based on active plans
      let totalLtv = 0;
      let planCount = 0;
      
      for (const sub of activeSubscriptions.data) {
        const productId = sub.items.data[0]?.price.product as string;
        const planInfo = PLAN_PRICES[productId as keyof typeof PLAN_PRICES];
        if (planInfo) {
          // Simplified LTV: monthly price * 12 months average lifetime
          totalLtv += planInfo.price * 12;
          planCount++;
        }
      }
      
      const avgLtv = planCount > 0 ? totalLtv / planCount : 0;
      
      lifetimeValueTrend.push({
        month: monthStr,
        ltv: avgLtv,
      });
    }

    return new Response(
      JSON.stringify({
        monthlyChurnRate,
        totalCancellations,
        activeSubscribers,
        retentionRate,
        cancellationsByPlan: cancellationsByPlanArray,
        cancellationReasons: cancellationReasonsArray,
        churnTrend,
        lifetimeValueTrend,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-churn-analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
