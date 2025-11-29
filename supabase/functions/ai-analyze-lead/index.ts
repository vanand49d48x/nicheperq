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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: 'lead_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch lead details
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

    // Fetch contact notes
    const { data: notes } = await supabaseClient
      .from('contact_notes')
      .select('note_text, created_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch email history
    const { data: emails } = await supabaseClient
      .from('ai_email_drafts')
      .select('subject, status, created_at, sent_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent reviews
    const { data: reviews } = await supabaseClient
      .from('lead_reviews')
      .select('review_text, rating, author_name, review_date')
      .eq('lead_id', lead_id)
      .order('review_date', { ascending: false })
      .limit(10);

    // Build context for AI
    const context = `
Lead Information:
- Business: ${lead.business_name}
- Niche: ${lead.niche}
- Rating: ${lead.rating || 'N/A'} (${lead.review_count || 0} reviews)
- Status: ${lead.contact_status || 'new'}
- Location: ${lead.city}, ${lead.state || ''}
- Contact Info: ${lead.phone ? 'Phone available' : 'No phone'}, ${lead.website ? 'Website available' : 'No website'}
- Last Contacted: ${lead.last_contacted_at || 'Never'}
- Next Follow-up: ${lead.next_follow_up_at || 'Not set'}

Recent Notes (${notes?.length || 0}):
${notes?.map(n => `- ${n.note_text} (${new Date(n.created_at).toLocaleDateString()})`).join('\n') || 'No notes'}

Email History (${emails?.length || 0}):
${emails?.map(e => `- ${e.subject} - ${e.status} (${new Date(e.created_at).toLocaleDateString()})`).join('\n') || 'No emails sent'}

Customer Reviews (${reviews?.length || 0}):
${reviews?.map(r => `- ${r.rating ? `${r.rating}★` : 'No rating'} by ${r.author_name || 'Anonymous'}: "${r.review_text}" ${r.review_date ? `(${new Date(r.review_date).toLocaleDateString()})` : ''}`).join('\n') || 'No reviews available'}
`;

    const systemPrompt = `You are an AI sales intelligence assistant analyzing B2B leads for a CRM system.

Analyze the lead information and provide scores from 0-100 for each metric:

1. Quality Score (0-100): Overall lead quality based on business data, rating, reviews, and customer feedback
2. Intent Score (0-100): Likelihood they're interested based on status, activity, responses
3. Closing Probability (0-100): Likelihood of successfully closing this lead
4. Risk Score (0-100): Risk of losing this lead (100 = very high risk)

Also provide:
- Sentiment: "hot", "warm", or "cold"
- Recommended Action: What should the user do next?
- Recommended Tone: "friendly", "professional", or "direct"
- Reasoning: Brief explanation of your analysis

Consider:
- High ratings (4.5+) and many reviews = higher quality
- Review sentiment and content = insight into customer satisfaction and pain points
- Recent activity = higher intent
- Long time since contact = higher risk
- Status "new" or "attempted" with no follow-up = needs action
- Status "warm" or "qualified" = high potential
- Negative review patterns = potential concerns to address
- Positive review themes = strengths to emphasize in outreach`;

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Call OpenAI API with structured output
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_lead',
            description: 'Analyze a lead and return AI scores and recommendations',
            parameters: {
              type: 'object',
              properties: {
                quality_score: { type: 'integer', minimum: 0, maximum: 100 },
                intent_score: { type: 'integer', minimum: 0, maximum: 100 },
                closing_probability: { type: 'integer', minimum: 0, maximum: 100 },
                risk_score: { type: 'integer', minimum: 0, maximum: 100 },
                sentiment: { type: 'string', enum: ['hot', 'warm', 'cold'] },
                recommended_action: { type: 'string' },
                recommended_tone: { type: 'string', enum: ['friendly', 'professional', 'direct'] },
                reasoning: { type: 'string' }
              },
              required: ['quality_score', 'intent_score', 'closing_probability', 'risk_score', 'sentiment', 'recommended_action', 'recommended_tone', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_lead' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received:', JSON.stringify(aiData, null, 2));
    
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in AI response. Full response:', JSON.stringify(aiData, null, 2));
      throw new Error('No tool call in AI response');
    }

    console.log('Tool call arguments:', toolCall.function.arguments);
    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Parsed analysis:', JSON.stringify(analysis, null, 2));

    // Update lead with AI scores
    console.log('Updating lead with scores:', {
      lead_id,
      ai_quality_score: analysis.quality_score,
      ai_intent_score: analysis.intent_score,
      closing_probability: analysis.closing_probability,
      risk_score: analysis.risk_score,
      sentiment: analysis.sentiment
    });

    const { data: updateData, error: updateError } = await supabaseClient
      .from('leads')
      .update({
        ai_quality_score: analysis.quality_score,
        ai_intent_score: analysis.intent_score,
        closing_probability: analysis.closing_probability,
        risk_score: analysis.risk_score,
        sentiment: analysis.sentiment,
        recommended_action: analysis.recommended_action,
        recommended_tone: analysis.recommended_tone,
        last_ai_analysis_at: new Date().toISOString()
      })
      .eq('id', lead_id)
      .select();

    if (updateError) {
      console.error('Error updating lead:', updateError);
      throw updateError;
    }

    console.log('Lead updated successfully:', updateData);

    // Store historical record
    const { error: historyError } = await supabaseClient
      .from('lead_ai_scores')
      .insert({
        lead_id: lead_id,
        quality_score: analysis.quality_score,
        intent_score: analysis.intent_score,
        closing_probability: analysis.closing_probability,
        risk_score: analysis.risk_score,
        reasoning: {
          sentiment: analysis.sentiment,
          recommended_action: analysis.recommended_action,
          recommended_tone: analysis.recommended_tone,
          explanation: analysis.reasoning
        }
      });

    if (historyError) {
      console.error('Error storing history:', historyError);
    }

    console.log('Analysis complete, returning success response');
    
    return new Response(JSON.stringify({ 
      success: true,
      analysis 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-analyze-lead:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
