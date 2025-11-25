import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false, role: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let role = 'free';
    let hasCrmAccess = false;
    let hasAiAccess = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Processing subscription", { subscriptionId: subscription.id, currentPeriodEnd: subscription.current_period_end });
      
      try {
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        }
      } catch (error) {
        logStep("Error converting subscription end date", { error: error instanceof Error ? error.message : String(error) });
      }
      
      productId = subscription.items.data[0].price.product as string;
      logStep("Found product ID", { productId });
      
      // NEW PRICING STRUCTURE
      // STANDARD ($29): 500 leads/month, no CRM, no AI
      // ADVANCED ($79): 2,500 leads/month, CRM, no AI  
      // PRO ($149): 5,000 leads/month, CRM, AI
      
      if (productId === 'prod_TTHC3h7eK0PPbF') {
        role = 'standard';
        hasCrmAccess = false;
        hasAiAccess = false;
      } else if (productId === 'prod_TTHDn12y4fsfxN') {
        role = 'advanced';
        hasCrmAccess = true;
        hasAiAccess = false;
      } else if (productId === 'prod_TTHDpODFYYL6lU') {
        role = 'pro';
        hasCrmAccess = true;
        hasAiAccess = true;
      }
      // Legacy product IDs (keep for existing subscribers)
      else if (productId === 'prod_TSgCmlQrmOhUOP') {
        role = 'basic';
        hasCrmAccess = false;
        hasAiAccess = false;
      } else if (productId === 'prod_TSgCGfVEfTUshN') {
        role = 'standard';
        hasCrmAccess = false;
        hasAiAccess = false;
      } else if (productId === 'prod_TSgD6DT8JB4K8f') {
        role = 'advanced';
        hasCrmAccess = true;
        hasAiAccess = false;
      } else if (productId === 'prod_RQ5qcKuJ3aBRCL') {
        role = 'pro';
        hasCrmAccess = true;
        hasAiAccess = true;
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, role, productId, hasCrmAccess, hasAiAccess });

      // Update user role and feature flags in database
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .update({ 
          role,
          has_crm_access: hasCrmAccess,
          has_ai_access: hasAiAccess
        })
        .eq('user_id', user.id);

      if (roleError) {
        logStep("Error updating user role", { error: roleError });
      } else {
        logStep("User role updated successfully", { role, hasCrmAccess, hasAiAccess });
      }
      // Check for admin overrides before updating
      const { data: existingRole } = await supabaseClient
        .from('user_roles')
        .select('custom_lead_limit, has_crm_access, has_ai_access, role')
        .eq('user_id', user.id)
        .single();

      // Detect admin override: custom limit set OR features/role don't match subscription tier
      const expectedCrmAccess = hasCrmAccess;
      const expectedAiAccess = hasAiAccess;
      const expectedRole = role;
      
      const hasCustomOverride = existingRole && (
        existingRole.custom_lead_limit !== null ||
        existingRole.has_crm_access !== expectedCrmAccess ||
        existingRole.has_ai_access !== expectedAiAccess ||
        existingRole.role !== expectedRole
      );
      
      if (!hasCustomOverride) {
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .update({ 
            role,
            has_crm_access: hasCrmAccess,
            has_ai_access: hasAiAccess
          })
          .eq('user_id', user.id);

        if (roleError) {
          logStep("Error updating user role", { error: roleError });
        } else {
          logStep("User role updated successfully", { role, hasCrmAccess, hasAiAccess });
        }
      } else if (existingRole) {
        logStep("Skipping role update - admin override detected", { 
          customLeadLimit: existingRole.custom_lead_limit,
          manualCrmAccess: existingRole.has_crm_access,
          manualAiAccess: existingRole.has_ai_access 
        });
        // Use the manually set values for response
        role = existingRole.role;
        hasCrmAccess = existingRole.has_crm_access;
        hasAiAccess = existingRole.has_ai_access;
      }
    } else {
      logStep("No active subscription, checking for manual overrides");
      
      // Check for admin overrides
      const { data: existingRole } = await supabaseClient
        .from('user_roles')
        .select('custom_lead_limit, has_crm_access, has_ai_access, role')
        .eq('user_id', user.id)
        .single();

      // If no subscription, any role other than 'free' or any feature access is a manual override
      const hasCustomOverride = existingRole && (
        existingRole.custom_lead_limit !== null ||
        existingRole.role !== 'free' ||
        existingRole.has_crm_access === true ||
        existingRole.has_ai_access === true
      );
      
      if (!hasCustomOverride) {
        // Update user role to free if no subscription and no admin override
        const { error: roleError } = await supabaseClient
          .from('user_roles')
          .update({ 
            role: 'free',
            has_crm_access: false,
            has_ai_access: false
          })
          .eq('user_id', user.id);

        if (roleError) {
          logStep("Error updating user role to free", { error: roleError });
        }
      } else if (existingRole) {
        logStep("Skipping role update - admin override detected for free tier", {
          customLeadLimit: existingRole.custom_lead_limit,
          manualCrmAccess: existingRole.has_crm_access,
          manualAiAccess: existingRole.has_ai_access
        });
        // Use the manually set values
        role = existingRole.role;
        hasCrmAccess = existingRole.has_crm_access;
        hasAiAccess = existingRole.has_ai_access;
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      role,
      has_crm_access: hasCrmAccess,
      has_ai_access: hasAiAccess
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, subscribed: false, role: 'free' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
