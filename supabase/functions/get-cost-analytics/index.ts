import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CONFIGURABLE: Cost per lead in USD (change this value as needed)
const COST_PER_LEAD = 0.01; // $0.01 per lead - UPDATE THIS VALUE

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

    // Get current month's usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: currentMonthUsage, error: usageError } = await supabaseClient
      .from("api_usage")
      .select("user_id, leads_count, created_at")
      .gte("created_at", startOfMonth.toISOString());

    if (usageError) throw usageError;

    const totalApiCalls = currentMonthUsage?.length || 0;
    const totalLeads = currentMonthUsage?.reduce((sum, record) => sum + (record.leads_count || 0), 0) || 0;
    const totalCost = totalLeads * COST_PER_LEAD;

    // Get unique users for average calculation
    const uniqueUsers = new Set(currentMonthUsage?.map(r => r.user_id) || []).size;
    const averageCostPerUser = uniqueUsers > 0 ? totalCost / uniqueUsers : 0;

    // Calculate costs by user tier
    const userIds = Array.from(new Set(currentMonthUsage?.map(r => r.user_id) || []));
    const { data: userRoles } = await supabaseClient
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const costByTier: { [key: string]: { calls: number; leads: number; cost: number } } = {};

    for (const usage of currentMonthUsage || []) {
      const userRole = userRoles?.find(r => r.user_id === usage.user_id);
      const tier = userRole?.role || "free";
      
      if (!costByTier[tier]) {
        costByTier[tier] = { calls: 0, leads: 0, cost: 0 };
      }
      
      costByTier[tier].calls += 1;
      costByTier[tier].leads += usage.leads_count || 0;
      costByTier[tier].cost += (usage.leads_count || 0) * COST_PER_LEAD;
    }

    const costByTierArray = Object.entries(costByTier).map(([tier, data]) => ({
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      calls: data.calls,
      cost: data.cost,
    }));

    // Get historical costs (last 6 months)
    const historicalCosts: { month: string; cost: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = monthStart.toLocaleString('default', { month: 'short', year: 'numeric' });

      const { data: monthUsage } = await supabaseClient
        .from("api_usage")
        .select("leads_count")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const monthLeads = monthUsage?.reduce((sum, record) => sum + (record.leads_count || 0), 0) || 0;
      const monthCost = monthLeads * COST_PER_LEAD;

      historicalCosts.push({
        month: monthStr,
        cost: monthCost,
      });
    }

    return new Response(
      JSON.stringify({
        totalApiCalls,
        totalCost,
        averageCostPerUser,
        costByTier: costByTierArray,
        historicalCosts,
        costPerLead: COST_PER_LEAD,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-cost-analytics:", error);
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
