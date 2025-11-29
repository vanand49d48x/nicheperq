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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { lead_id } = await req.json();

    // Fetch lead data
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    // Fetch all notes
    const { data: notes } = await supabaseClient
      .from('contact_notes')
      .select('note_text, created_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    // Fetch email history
    const { data: emails } = await supabaseClient
      .from('ai_email_drafts')
      .select('subject, status, sent_at, opened_at, replied_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    const context = `
Contact: ${lead.business_name}
Status: ${lead.contact_status}
Last Contacted: ${lead.last_contacted_at || 'Never'}

Notes History:
${notes?.map(n => `${new Date(n.created_at).toLocaleDateString()}: ${n.note_text}`).join('\n') || 'No notes'}

Email History:
${emails?.map(e => `- ${e.subject} (${e.status}) ${e.opened_at ? '✓ Opened' : ''} ${e.replied_at ? '✓ Replied' : ''}`).join('\n') || 'No emails sent'}
`;

    const systemPrompt = `You are an AI assistant analyzing contact interactions for a referral network. Based on the conversation history and engagement patterns, provide actionable insights.

Analyze:
1. Engagement level (positive, neutral, negative)
2. Best next action
3. Recommended status update
4. Key insights from interactions`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this contact:\n\n${context}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_contact',
            description: 'Provide contact analysis and recommendations',
            parameters: {
              type: 'object',
              properties: {
                sentiment: { 
                  type: 'string', 
                  enum: ['positive', 'neutral', 'negative'],
                  description: 'Overall engagement sentiment'
                },
                suggested_status: { 
                  type: 'string',
                  enum: ['new', 'attempted', 'connected', 'in_conversation', 'active_partner', 'do_not_contact'],
                  description: 'Recommended contact status'
                },
                next_action: { 
                  type: 'string',
                  description: 'Recommended next step (e.g., "Send follow-up", "Schedule call", "Wait 1 week")'
                },
                reasoning: { 
                  type: 'string',
                  description: 'Brief explanation of recommendations'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Priority level for follow-up'
                }
              },
              required: ['sentiment', 'suggested_status', 'next_action', 'reasoning', 'priority']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_contact' } }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${await response.text()}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error analyzing contact:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});