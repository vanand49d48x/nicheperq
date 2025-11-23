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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all leads for the user
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    if (leadsError) throw leadsError;

    // Fetch email drafts with tracking
    const { data: emails, error: emailsError } = await supabase
      .from('ai_email_drafts')
      .select('*, email_tracking(*)')
      .eq('user_id', user.id);

    if (emailsError) throw emailsError;

    // Fetch workflow enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('workflow_enrollments')
      .select('*')
      .eq('user_id', user.id);

    if (enrollmentsError) throw enrollmentsError;

    // Calculate conversion funnel
    const statusCounts = {
      new: leads?.filter(l => l.contact_status === 'new').length || 0,
      contacted: leads?.filter(l => l.contact_status === 'contacted').length || 0,
      qualified: leads?.filter(l => l.contact_status === 'qualified').length || 0,
      proposal: leads?.filter(l => l.contact_status === 'proposal').length || 0,
      negotiation: leads?.filter(l => l.contact_status === 'negotiation').length || 0,
      closed: leads?.filter(l => l.contact_status === 'closed').length || 0,
    };

    const totalLeads = leads?.length || 0;
    const conversionRates = {
      newToContacted: totalLeads > 0 ? ((statusCounts.contacted + statusCounts.qualified + statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) / totalLeads * 100) : 0,
      contactedToQualified: statusCounts.contacted > 0 ? ((statusCounts.qualified + statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) / (statusCounts.contacted + statusCounts.qualified + statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) * 100) : 0,
      qualifiedToProposal: statusCounts.qualified > 0 ? ((statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) / (statusCounts.qualified + statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) * 100) : 0,
      proposalToClosed: statusCounts.proposal > 0 ? ((statusCounts.negotiation + statusCounts.closed) / (statusCounts.proposal + statusCounts.negotiation + statusCounts.closed) * 100) : 0,
    };

    // Niche performance
    const nicheStats: Record<string, any> = {};
    leads?.forEach(lead => {
      if (!nicheStats[lead.niche]) {
        nicheStats[lead.niche] = {
          total: 0,
          closed: 0,
          avgQualityScore: 0,
          avgIntentScore: 0,
          scoreCount: 0,
        };
      }
      nicheStats[lead.niche].total++;
      if (lead.contact_status === 'closed') nicheStats[lead.niche].closed++;
      if (lead.ai_quality_score) {
        nicheStats[lead.niche].avgQualityScore += lead.ai_quality_score;
        nicheStats[lead.niche].scoreCount++;
      }
      if (lead.ai_intent_score) {
        nicheStats[lead.niche].avgIntentScore += lead.ai_intent_score;
      }
    });

    Object.keys(nicheStats).forEach(niche => {
      const stats = nicheStats[niche];
      stats.conversionRate = stats.total > 0 ? (stats.closed / stats.total * 100) : 0;
      stats.avgQualityScore = stats.scoreCount > 0 ? (stats.avgQualityScore / stats.scoreCount) : 0;
      stats.avgIntentScore = stats.scoreCount > 0 ? (stats.avgIntentScore / stats.scoreCount) : 0;
    });

    // Email performance
    const totalSent = emails?.filter(e => e.status === 'sent').length || 0;
    const totalOpened = emails?.filter(e => e.opened_at).length || 0;
    const totalReplied = emails?.filter(e => e.replied_at).length || 0;
    const openRate = totalSent > 0 ? (totalOpened / totalSent * 100) : 0;
    const replyRate = totalSent > 0 ? (totalReplied / totalSent * 100) : 0;
    
    const emailStats = {
      totalSent,
      totalOpened,
      totalReplied,
      openRate,
      replyRate,
    };

    // Stage velocity (days in each stage)
    const stageVelocity = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
    };

    // Call AI for recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `Analyze this CRM pipeline data and provide actionable recommendations:

**Pipeline Overview:**
- Total Leads: ${totalLeads}
- Status Distribution: ${JSON.stringify(statusCounts)}
- Conversion Rates: ${JSON.stringify(conversionRates)}

**Email Performance:**
- Open Rate: ${emailStats.openRate.toFixed(1)}%
- Reply Rate: ${emailStats.replyRate.toFixed(1)}%

**Top Niches:**
${Object.entries(nicheStats).slice(0, 5).map(([niche, stats]: [string, any]) => 
  `- ${niche}: ${stats.total} leads, ${stats.conversionRate.toFixed(1)}% conversion`
).join('\n')}

Provide 3-5 specific, actionable recommendations to improve conversion rates and sales velocity. Focus on bottlenecks and quick wins.`;

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
            content: 'You are a sales analytics expert. Provide clear, actionable recommendations in a numbered list format.'
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
    const recommendations = aiData.choices[0]?.message?.content || 'No recommendations available';

    return new Response(
      JSON.stringify({
        overview: {
          totalLeads,
          statusCounts,
          conversionRates,
        },
        nichePerformance: Object.entries(nicheStats).map(([niche, stats]) => ({
          niche,
          ...stats,
        })).sort((a, b) => b.conversionRate - a.conversionRate),
        emailPerformance: emailStats,
        stageVelocity,
        workflowStats: {
          active: enrollments?.filter(e => e.status === 'active').length || 0,
          completed: enrollments?.filter(e => e.status === 'completed').length || 0,
        },
        aiRecommendations: recommendations,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Pipeline analytics error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});