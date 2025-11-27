import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 AI Generate Insights: Starting request...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create admin client for querying data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;
    
    console.log('✅ User authenticated:', userId);

    if (!userId) {
      console.error('No user ID in token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's leads with relevant data
    console.log('[Insights] Fetching leads data...');
    const leadsStartTime = Date.now();
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);

    const leadsQueryTime = Date.now() - leadsStartTime;
    console.log('[Insights] Leads query complete', {
      count: leads?.length || 0,
      hasError: !!leadsError,
      queryTimeMs: leadsQueryTime
    });

    if (leadsError) throw leadsError;

    // Fetch recent workflow activity
    console.log('[Insights] Fetching workflow enrollments...');
    const enrollmentsStartTime = Date.now();
    const { data: enrollments } = await supabase
      .from('workflow_enrollments')
      .select('*, ai_workflows(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const enrollmentsQueryTime = Date.now() - enrollmentsStartTime;
    console.log('[Insights] Enrollments query complete', {
      count: enrollments?.length || 0,
      queryTimeMs: enrollmentsQueryTime
    });

    // Fetch recent email activity
    console.log('[Insights] Fetching email drafts...');
    const emailsStartTime = Date.now();
    const { data: emails } = await supabase
      .from('ai_email_drafts')
      .select('status, opened_at, replied_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const emailsQueryTime = Date.now() - emailsStartTime;
    console.log('[Insights] Emails query complete', {
      count: emails?.length || 0,
      queryTimeMs: emailsQueryTime
    });

    // Calculate stats
    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter(l => l.contact_status === 'new').length || 0;
    const activeLeads = leads?.filter(l => !['closed', 'do_not_contact'].includes(l.contact_status)).length || 0;
    const highQualityLeads = leads?.filter(l => (l.ai_quality_score || 0) >= 7).length || 0;
    const staleLeads = leads?.filter(l => {
      const lastContact = l.last_contacted_at ? new Date(l.last_contacted_at) : null;
      return lastContact && (Date.now() - lastContact.getTime()) > 14 * 24 * 60 * 60 * 1000;
    }).length || 0;

    const emailStats = {
      sent: emails?.filter(e => e.status === 'sent').length || 0,
      opened: emails?.filter(e => e.opened_at).length || 0,
      replied: emails?.filter(e => e.replied_at).length || 0,
    };

    const openRate = emailStats.sent > 0 ? (emailStats.opened / emailStats.sent * 100).toFixed(1) : '0';
    const replyRate = emailStats.sent > 0 ? (emailStats.replied / emailStats.sent * 100).toFixed(1) : '0';

    // Call Lovable AI for insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this CRM data and provide 3-5 specific, actionable insights:

**Pipeline Stats:**
- Total Leads: ${totalLeads}
- New Leads: ${newLeads}
- Active Leads: ${activeLeads}
- High Quality Leads (AI score ≥7): ${highQualityLeads}
- Stale Leads (no contact 14+ days): ${staleLeads}

**Email Performance:**
- Sent: ${emailStats.sent}
- Open Rate: ${openRate}%
- Reply Rate: ${replyRate}%

**Active Workflows:**
- ${enrollments?.length || 0} active enrollments

**Sample Lead Data:**
${leads?.slice(0, 5).map(l => 
  `- ${l.business_name} (${l.niche}, ${l.contact_status}, Quality: ${l.ai_quality_score || 'N/A'})`
).join('\n')}

Provide insights as a JSON array of objects with this structure:
[
  {
    "type": "priority" | "opportunity" | "warning",
    "title": "Short title",
    "description": "Detailed actionable description",
    "leadId": "optional_lead_id_if_specific",
    "leadName": "optional_business_name_if_specific"
  }
]

Focus on:
1. Leads needing immediate attention
2. High-value opportunities being missed
3. Process improvements based on patterns
4. Specific next actions the user should take`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a CRM analytics expert. Analyze data and provide actionable insights in JSON format. Be specific and include lead names when possible.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI request failed');
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response (handle markdown code blocks)
    let insights;
    try {
      const jsonMatch = insightsText.match(/\[[\s\S]*\]/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse AI insights:', e);
      insights = [];
    }

    return new Response(
      JSON.stringify({ insights }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
