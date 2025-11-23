import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lead_id, action_type, additional_context } = await req.json();

    if (!lead_id || !action_type) {
      return new Response(JSON.stringify({ error: 'lead_id and action_type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch complete lead details
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all contact notes
    const { data: notes } = await supabaseClient
      .from('contact_notes')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    // Fetch email drafts
    const { data: emails } = await supabaseClient
      .from('ai_email_drafts')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    // Fetch interactions
    const { data: interactions } = await supabaseClient
      .from('lead_interactions')
      .select('*')
      .eq('lead_id', lead_id)
      .order('occurred_at', { ascending: false })
      .limit(20);

    // Fetch AI scores history
    const { data: aiScores } = await supabaseClient
      .from('lead_ai_scores')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build comprehensive context
    const context = `
Lead Profile:
- Business: ${lead.business_name}
- Niche: ${lead.niche}
- Location: ${lead.city}, ${lead.state || ''}
- Rating: ${lead.rating || 'N/A'} (${lead.review_count || 0} reviews)
- Contact Status: ${lead.contact_status || 'new'}
- Phone: ${lead.phone || 'Not available'}
- Website: ${lead.website || 'Not available'}
- Email: ${lead.email || 'Not available'}

AI Intelligence:
- Quality Score: ${lead.ai_quality_score || 'Not analyzed'}
- Intent Score: ${lead.ai_intent_score || 'Not analyzed'}
- Closing Probability: ${lead.closing_probability || 'Not analyzed'}%
- Risk Score: ${lead.risk_score || 'Not analyzed'}
- Sentiment: ${lead.sentiment || 'Unknown'}
- Recommended Action: ${lead.recommended_action || 'None'}
- Recommended Tone: ${lead.recommended_tone || 'professional'}

Activity Timeline:
- Last Contacted: ${lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : 'Never'}
- Next Follow-up: ${lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString() : 'Not scheduled'}
- Last AI Analysis: ${lead.last_ai_analysis_at ? new Date(lead.last_ai_analysis_at).toLocaleDateString() : 'Never'}

Contact Notes (${notes?.length || 0} total):
${notes?.slice(0, 10).map(n => `- [${n.note_type || 'manual'}] ${n.note_text} (${new Date(n.created_at).toLocaleDateString()})${n.sentiment ? ` - Sentiment: ${n.sentiment}` : ''}`).join('\n') || 'No notes'}

Email History (${emails?.length || 0} total):
${emails?.slice(0, 10).map(e => `- Subject: "${e.subject}" - Status: ${e.status} - Sent: ${e.sent_at ? new Date(e.sent_at).toLocaleDateString() : 'Draft'} - ${e.opened_at ? 'OPENED' : 'Not opened'}`).join('\n') || 'No emails sent'}

Recent Interactions (${interactions?.length || 0} total):
${interactions?.slice(0, 10).map(i => `- ${i.interaction_type} at ${new Date(i.occurred_at).toLocaleString()}`).join('\n') || 'No interactions recorded'}

AI Score Trend:
${aiScores?.map(s => `- Quality: ${s.quality_score}, Intent: ${s.intent_score}, Close: ${s.closing_probability}% (${new Date(s.created_at).toLocaleDateString()})`).join('\n') || 'No historical scores'}
`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    // Action-specific prompts
    switch (action_type) {
      case 'suggest_email':
        systemPrompt = `You are an expert sales copywriter. Generate a personalized email for this B2B lead based on their complete profile and interaction history. Use the recommended tone (${lead.recommended_tone || 'professional'}).`;
        userPrompt = `Based on this lead's profile and history, draft a compelling email that:\n1. References their business and niche specifically\n2. Addresses their current status (${lead.contact_status})\n3. Includes a clear call-to-action\n4. Uses the ${lead.recommended_tone || 'professional'} tone\n\nAdditional context: ${additional_context || 'None'}\n\nContext:\n${context}`;
        break;

      case 'suggest_call_script':
        systemPrompt = `You are a sales coach. Create a call script for speaking with this lead.`;
        userPrompt = `Generate a phone call script for this lead that:\n1. Opens with a strong introduction\n2. References their business specifics\n3. Addresses potential objections\n4. Includes discovery questions\n5. Ends with next steps\n\nContext:\n${context}`;
        break;

      case 'predict_outcome':
        systemPrompt = `You are a sales analytics expert. Analyze this lead's data and predict their likelihood of conversion.`;
        userPrompt = `Analyze this lead and provide:\n1. Likelihood of closing (percentage and reasoning)\n2. Key risk factors\n3. Opportunities to improve conversion\n4. Timeline prediction\n5. Recommended next actions\n\nContext:\n${context}`;
        break;

      case 'summarize':
        systemPrompt = `You are a CRM intelligence assistant. Summarize the lead's complete journey and current state.`;
        userPrompt = `Provide a comprehensive summary including:\n1. Lead quality and potential\n2. Engagement history\n3. Current status and momentum\n4. Key insights from interactions\n5. What's working and what's not\n6. Critical next steps\n\nContext:\n${context}`;
        break;

      default:
        systemPrompt = `You are a helpful AI assistant for CRM management.`;
        userPrompt = `${additional_context || 'Help me understand this lead.'}\n\nContext:\n${context}`;
    }

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Log interaction
    await supabaseClient
      .from('lead_interactions')
      .insert({
        lead_id: lead_id,
        user_id: user.id,
        interaction_type: 'ai_assistant_query',
        metadata: {
          action_type,
          response_preview: aiContent.substring(0, 100)
        },
        occurred_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ 
      success: true,
      response: aiContent,
      lead_summary: {
        quality_score: lead.ai_quality_score,
        sentiment: lead.sentiment,
        recommended_action: lead.recommended_action
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-lead-assistant:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
