import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { draft_id, send_now = true } = await req.json();

    // Fetch draft
    const { data: draft, error: draftError } = await supabaseClient
      .from('ai_email_drafts')
      .select(`
        *,
        leads (
          business_name,
          phone,
          website,
          city,
          state
        )
      `)
      .eq('id', draft_id)
      .single();

    if (draftError) throw draftError;
    if (draft.status === 'sent') throw new Error('Email already sent');

    // Extract email from phone or website (simplified - in production, you'd need proper email collection)
    const lead = draft.leads;
    const recipientEmail = `contact@${lead.business_name.toLowerCase().replace(/\s+/g, '')}.com`; // Placeholder

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Add footer with compliance info
    const emailBody = `${draft.body}

---
${user.email}
${lead.city}${lead.state ? ', ' + lead.state : ''}

This email was sent as part of a professional referral network outreach. If you'd prefer not to receive future emails, please reply with "unsubscribe".
`;

    if (send_now) {
      // Send email immediately
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${user.email?.split('@')[0] || 'contact'} <onboarding@resend.dev>`, // Use verified domain in production
        to: [recipientEmail],
        subject: draft.subject,
        text: emailBody,
      });

      if (emailError) throw new Error(`Failed to send email: ${emailError.message}`);

      // Update draft status
      const { error: updateError } = await supabaseClient
        .from('ai_email_drafts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', draft_id);

      if (updateError) throw updateError;

      // Update lead's last_contacted_at
      await supabaseClient
        .from('leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', draft.lead_id);

      // Log email tracking
      await supabaseClient
        .from('email_tracking')
        .insert({
          email_draft_id: draft_id,
          event_type: 'sent',
          event_data: { message_id: emailData?.id }
        });

      // Log automation action
      await supabaseClient
        .from('ai_automation_logs')
        .insert({
          user_id: user.id,
          lead_id: draft.lead_id,
          action_type: 'email_sent',
          ai_decision: { draft_id, recipient: recipientEmail },
          success: true
        });

      return new Response(JSON.stringify({ 
        success: true, 
        message_id: emailData?.id,
        sent_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Schedule for later
      const { error: updateError } = await supabaseClient
        .from('ai_email_drafts')
        .update({ status: 'approved' })
        .eq('id', draft_id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email approved and queued'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});