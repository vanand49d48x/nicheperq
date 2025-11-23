import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📊 Generating daily digests for all users...');

    // Get all active users with CRM access
    const { data: users, error: usersError } = await supabase
      .from('user_roles')
      .select('user_id, profiles(email, full_name)')
      .eq('has_crm_access', true);

    if (usersError || !users?.length) {
      console.log('No users to send digest to');
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
    }

    console.log(`Processing digests for ${users.length} users`);
    let sentCount = 0;

    for (const userRole of users) {
      try {
        const userId = userRole.user_id;
        const profile = Array.isArray(userRole.profiles) ? userRole.profiles[0] : userRole.profiles;
        const email = profile?.email;
        const name = profile?.full_name || 'there';

        if (!email) continue;

        // Generate digest for this user
        const digest = await generateDigest(supabase, userId);

        if (digest.hasActivity) {
          await sendDigestEmail(email, name, digest);
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send digest for user:`, error);
      }
    }

    console.log(`✅ Sent ${sentCount} digests`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Daily digest error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateDigest(supabase: any, userId: string) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get high priority leads (needs follow-up)
  const { data: priorityLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .not('next_follow_up_at', 'is', null)
    .lte('next_follow_up_at', new Date().toISOString())
    .limit(5);

  // Get recent email opens/replies
  const { data: emailActivity } = await supabase
    .from('email_tracking')
    .select('*, ai_email_drafts(lead_id, leads(business_name))')
    .eq('ai_email_drafts.user_id', userId)
    .gte('timestamp', yesterday);

  // Get new leads
  const { data: newLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', yesterday);

  // Get active workflows
  const { data: activeWorkflows } = await supabase
    .from('workflow_enrollments')
    .select('*, leads(business_name), ai_workflows(name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(10);

  // Get AI recommendations
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  let aiRecommendations = '';

  if (LOVABLE_API_KEY && priorityLeads?.length) {
    const prompt = `Based on these ${priorityLeads.length} leads needing follow-up, provide 3 quick action recommendations for today:\n${priorityLeads.map((l: any) => `- ${l.business_name} (${l.niche}): ${l.contact_status}`).join('\n')}`;

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Provide 3 brief, actionable recommendations in bullet points.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiRecommendations = aiData.choices[0]?.message?.content || '';
      }
    } catch (e) {
      console.error('AI recommendations failed:', e);
    }
  }

  return {
    hasActivity: (priorityLeads?.length || 0) > 0 || (newLeads?.length || 0) > 0 || (emailActivity?.length || 0) > 0,
    priorityLeads: priorityLeads || [],
    newLeads: newLeads || [],
    emailActivity: emailActivity || [],
    activeWorkflows: activeWorkflows || [],
    aiRecommendations,
  };
}

async function sendDigestEmail(email: string, name: string, digest: any) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
          .priority { background: #fef2f2; border-left-color: #ef4444; }
          .lead-item { padding: 12px; background: #f9fafb; margin-bottom: 10px; border-radius: 6px; }
          .badge { display: inline-block; padding: 4px 8px; background: #e0e7ff; color: #4338ca; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          h2 { margin-top: 0; color: #1f2937; }
          .stat { font-size: 24px; font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🌟 Daily CRM Digest</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your daily action plan from NichePerQ</p>
          </div>
          
          <div class="content">
            <p>Good morning, ${name}! 👋</p>
            <p>Here's what needs your attention today:</p>

            ${digest.priorityLeads.length > 0 ? `
              <div class="section priority">
                <h2>🔥 Priority Follow-Ups (${digest.priorityLeads.length})</h2>
                ${digest.priorityLeads.map((lead: any) => `
                  <div class="lead-item">
                    <strong>${lead.business_name}</strong>
                    <span class="badge">${lead.niche}</span>
                    <br/>
                    <small style="color: #6b7280;">Status: ${lead.contact_status} • Last contact: ${lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Never'}</small>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${digest.newLeads.length > 0 ? `
              <div class="section">
                <h2>📥 New Leads (${digest.newLeads.length})</h2>
                <p class="stat">${digest.newLeads.length}</p>
                <p>new leads added in the last 24 hours</p>
              </div>
            ` : ''}

            ${digest.emailActivity.length > 0 ? `
              <div class="section">
                <h2>📧 Email Activity</h2>
                <p>${digest.emailActivity.filter((e: any) => e.event_type === 'opened').length} opens, ${digest.emailActivity.filter((e: any) => e.event_type === 'replied').length} replies</p>
                ${digest.emailActivity.filter((e: any) => e.event_type === 'replied').slice(0, 3).map((activity: any) => `
                  <div class="lead-item">
                    <strong>Reply from:</strong> ${activity.ai_email_drafts?.leads?.business_name || 'Unknown'}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${digest.activeWorkflows.length > 0 ? `
              <div class="section">
                <h2>⚡ Active Workflows</h2>
                <p><span class="stat">${digest.activeWorkflows.length}</span> leads in automated workflows</p>
              </div>
            ` : ''}

            ${digest.aiRecommendations ? `
              <div class="section">
                <h2>💡 AI Recommendations for Today</h2>
                <div style="white-space: pre-wrap;">${digest.aiRecommendations}</div>
              </div>
            ` : ''}

            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/crm" class="cta">
              Open CRM Dashboard →
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  await resend.emails.send({
    from: 'NichePerQ CRM <crm@nicheperq.com>',
    to: [email],
    subject: `Your Daily CRM Digest - ${digest.priorityLeads.length} priority actions`,
    html,
  });

  console.log(`✅ Sent digest to ${email}`);
}