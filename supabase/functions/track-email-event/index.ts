import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const eventData = await req.json();
    console.log('Email event received:', eventData);

    const { type, data } = eventData;
    const emailId = data?.email_id;

    if (!emailId) {
      return new Response(JSON.stringify({ error: 'email_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the email draft
    const { data: draft } = await supabaseClient
      .from('ai_email_drafts')
      .select('id, lead_id, user_id')
      .eq('id', emailId)
      .single();

    if (!draft) {
      console.log('Email draft not found:', emailId);
      return new Response(JSON.stringify({ success: false, message: 'Draft not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update or create email tracking record
    const trackingUpdate: any = {
      email_draft_id: draft.id,
      event_type: type,
      event_data: data,
      timestamp: new Date().toISOString()
    };

    if (type === 'email.opened') {
      trackingUpdate.email_opened_at = new Date().toISOString();
      
      // Increment open count
      const { data: existing } = await supabaseClient
        .from('email_tracking')
        .select('open_count')
        .eq('email_draft_id', draft.id)
        .maybeSingle();

      if (existing) {
        await supabaseClient
          .from('email_tracking')
          .update({
            email_opened_at: trackingUpdate.email_opened_at,
            open_count: (existing.open_count || 0) + 1
          })
          .eq('email_draft_id', draft.id);
      } else {
        await supabaseClient
          .from('email_tracking')
          .insert({
            email_draft_id: draft.id,
            email_opened_at: trackingUpdate.email_opened_at,
            open_count: 1,
            event_type: type,
            event_data: data
          });
      }

      // Log interaction
      await supabaseClient
        .from('lead_interactions')
        .insert({
          lead_id: draft.lead_id,
          user_id: draft.user_id,
          interaction_type: 'email_opened',
          metadata: {
            email_id: draft.id,
            opened_at: trackingUpdate.email_opened_at
          },
          occurred_at: trackingUpdate.email_opened_at
        });

    } else if (type === 'email.clicked') {
      trackingUpdate.email_clicked_at = new Date().toISOString();

      const { data: existing } = await supabaseClient
        .from('email_tracking')
        .select('click_count')
        .eq('email_draft_id', draft.id)
        .maybeSingle();

      if (existing) {
        await supabaseClient
          .from('email_tracking')
          .update({
            email_clicked_at: trackingUpdate.email_clicked_at,
            click_count: (existing.click_count || 0) + 1
          })
          .eq('email_draft_id', draft.id);
      } else {
        await supabaseClient
          .from('email_tracking')
          .insert({
            email_draft_id: draft.id,
            email_clicked_at: trackingUpdate.email_clicked_at,
            click_count: 1,
            event_type: type,
            event_data: data
          });
      }

      await supabaseClient
        .from('lead_interactions')
        .insert({
          lead_id: draft.lead_id,
          user_id: draft.user_id,
          interaction_type: 'email_clicked',
          metadata: {
            email_id: draft.id,
            clicked_at: trackingUpdate.email_clicked_at,
            link: data.link
          },
          occurred_at: trackingUpdate.email_clicked_at
        });

    } else if (type === 'email.replied') {
      trackingUpdate.email_replied_at = new Date().toISOString();

      await supabaseClient
        .from('email_tracking')
        .upsert({
          email_draft_id: draft.id,
          email_replied_at: trackingUpdate.email_replied_at,
          event_type: type,
          event_data: data
        });

      await supabaseClient
        .from('lead_interactions')
        .insert({
          lead_id: draft.lead_id,
          user_id: draft.user_id,
          interaction_type: 'email_replied',
          metadata: {
            email_id: draft.id,
            replied_at: trackingUpdate.email_replied_at
          },
          occurred_at: trackingUpdate.email_replied_at
        });

      // Update lead status if needed
      await supabaseClient
        .from('leads')
        .update({
          contact_status: 'connected',
          last_contacted_at: trackingUpdate.email_replied_at
        })
        .eq('id', draft.lead_id);
    }

    console.log('Email event processed successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in track-email-event:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
