import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse Resend webhook payload
    const payload = await req.json();
    console.log('Received webhook event:', payload.type);

    const { type, data } = payload;
    
    // Extract email ID from Resend metadata (you'd need to pass this when sending)
    const messageId = data.email_id;

    // Find the draft associated with this message
    const { data: tracking } = await supabaseClient
      .from('email_tracking')
      .select('email_draft_id')
      .eq('event_type', 'sent')
      .contains('event_data', { message_id: messageId })
      .single();

    if (!tracking) {
      console.log('No draft found for message:', messageId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailDraftId = tracking.email_draft_id;

    // Map Resend event types to our tracking events
    let eventType = 'delivered';
    let updateFields: any = {};

    switch (type) {
      case 'email.opened':
        eventType = 'opened';
        updateFields = { opened_at: new Date().toISOString() };
        break;
      case 'email.clicked':
        eventType = 'clicked';
        break;
      case 'email.bounced':
        eventType = 'bounced';
        break;
      case 'email.delivered':
        eventType = 'delivered';
        break;
      default:
        console.log('Unhandled event type:', type);
    }

    // Log tracking event
    await supabaseClient
      .from('email_tracking')
      .insert({
        email_draft_id: emailDraftId,
        event_type: eventType,
        event_data: data
      });

    // Update draft record if needed
    if (Object.keys(updateFields).length > 0) {
      await supabaseClient
        .from('ai_email_drafts')
        .update(updateFields)
        .eq('id', emailDraftId);
    }

    // Check for auto-actions based on events
    if (eventType === 'opened') {
      const { data: draft } = await supabaseClient
        .from('ai_email_drafts')
        .select('lead_id, user_id')
        .eq('id', emailDraftId)
        .single();

      if (draft) {
        // Check if user has auto-actions enabled
        const { data: userRole } = await supabaseClient
          .from('user_roles')
          .select('crm_tier')
          .eq('user_id', draft.user_id)
          .single();

        // If Pro or Enterprise, check for follow-up workflows
        if (userRole?.crm_tier !== 'lite') {
          // Find workflows triggered by email opens
          const { data: workflows } = await supabaseClient
            .from('ai_workflows')
            .select('*')
            .eq('user_id', draft.user_id)
            .eq('is_active', true)
            .contains('trigger', { event: 'email_opened' });

          // Queue workflow execution
          if (workflows && workflows.length > 0) {
            console.log(`Found ${workflows.length} workflows to trigger`);
            // Workflows will be picked up by the cron executor
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});