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

    const { goal, deal_length, tone } = await req.json();

    console.log('Generating workflow for:', { goal, deal_length, tone });

    const systemPrompt = `You are an expert CRM automation strategist. Generate a complete multi-step workflow for lead nurturing and follow-up automation.

Return a structured workflow with steps that include:
- Action type (send_email, set_reminder, update_status)
- Delay between steps (in days)
- Email type and tone (for email steps)
- AI hints for email content generation
- Status updates

Consider the deal length:
- Short (1-2 weeks): 3-4 quick touchpoints
- Medium (1-2 months): 5-7 thoughtful steps
- Long (3-6 months): 8-12 strategic touchpoints

Tone should match: ${tone}`;

    const userPrompt = `Create a ${deal_length} nurture workflow for: "${goal}"

Goal context:
- Cold contact revival: Re-engage leads who went silent
- New lead nurture: Convert fresh leads to conversations
- Demo no-show: Follow up with missed appointments
- Trial expiring: Encourage conversion before trial ends
- Custom: ${goal}

Provide a complete workflow plan.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_workflow',
            description: 'Create a structured CRM workflow with multiple steps',
            parameters: {
              type: 'object',
              properties: {
                name: { 
                  type: 'string', 
                  description: 'Workflow name (e.g. "Cold Lead Revival - 30 Days")' 
                },
                description: { 
                  type: 'string', 
                  description: 'Brief description of workflow purpose' 
                },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: { 
                        type: 'string', 
                        enum: ['send_email', 'set_reminder', 'update_status'],
                        description: 'Action to perform' 
                      },
                      delay_days: { 
                        type: 'number', 
                        description: 'Days to wait before executing this step' 
                      },
                      email_type: { 
                        type: 'string', 
                        enum: ['initial', 'follow_up', 'meeting_request'],
                        description: 'Type of email (only for send_email action)' 
                      },
                      tone: { 
                        type: 'string', 
                        enum: ['professional', 'friendly', 'direct'],
                        description: 'Email tone (only for send_email action)' 
                      },
                      ai_prompt_hint: { 
                        type: 'string', 
                        description: 'Hint for AI email generation (e.g. "remind them we spoke 2 weeks ago")' 
                      },
                      new_status: { 
                        type: 'string', 
                        enum: ['attempted', 'connected', 'in_conversation', 'do_not_contact'],
                        description: 'New status (only for update_status action)' 
                      },
                      auto_send: { 
                        type: 'boolean', 
                        description: 'Whether to auto-send emails (false = requires approval)' 
                      }
                    },
                    required: ['action', 'delay_days']
                  }
                }
              },
              required: ['name', 'description', 'steps']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_workflow' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const workflow = JSON.parse(toolCall.function.arguments);

    console.log('Generated workflow:', workflow);

    return new Response(JSON.stringify(workflow), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating workflow:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
