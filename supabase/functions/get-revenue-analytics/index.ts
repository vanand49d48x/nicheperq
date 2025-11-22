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
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    // Calculate MRR and group by plan
    let mrr = 0;
    const revenueByPlan: { [key: string]: { revenue: number; subscribers: number } } = {};

    for (const sub of subscriptions.data) {
      const productId = sub.items.data[0]?.price.product as string;
      const planInfo = PLAN_PRICES[productId as keyof typeof PLAN_PRICES];
      
      if (planInfo) {
        mrr += planInfo.price;
        
        if (!revenueByPlan[planInfo.name]) {
          revenueByPlan[planInfo.name] = { revenue: 0, subscribers: 0 };
        }
        revenueByPlan[planInfo.name].revenue += planInfo.price;
        revenueByPlan[planInfo.name].subscribers += 1;
      }
    }

    // Format revenue by plan for charts
    const revenueByPlanArray = Object.entries(revenueByPlan).map(([plan, data]) => ({
      plan,
      revenue: data.revenue,
      subscribers: data.subscribers,
    }));

    // Get historical revenue (last 6 months)
    const historicalRevenue: { month: string; revenue: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // For simplicity, we'll use current MRR for all months
      // In production, you'd query historical subscription data
      historicalRevenue.push({
        month: monthStr,
        revenue: mrr,
      });
    }

    return new Response(
      JSON.stringify({
        mrr,
        activeSubscribers: subscriptions.data.length,
        revenueByPlan: revenueByPlanArray,
        historicalRevenue,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-revenue-analytics:", error);
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
