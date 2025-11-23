import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { question } = await req.json();

    // Fetch user's leads with related data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (leadsError) throw leadsError;

    // Get contact notes count for each lead
    const { data: notesData } = await supabase
      .from('contact_notes')
      .select('lead_id')
      .eq('user_id', user.id);

    // Get email drafts for engagement data
    const { data: emailData } = await supabase
      .from('ai_email_drafts')
      .select('lead_id, status, sent_at, opened_at')
      .eq('user_id', user.id);

    // Calculate stats
    const statusCounts = {
      new: leads?.filter(l => l.contact_status === 'new').length || 0,
      attempted: leads?.filter(l => l.contact_status === 'attempted_contact').length || 0,
      connected: leads?.filter(l => l.contact_status === 'connected').length || 0,
      in_conversation: leads?.filter(l => l.contact_status === 'in_conversation').length || 0,
      active_partner: leads?.filter(l => l.contact_status === 'active_partner').length || 0,
    };

    // Prepare context for AI
    const context = `
User's CRM Overview:
- Total Contacts: ${leads?.length || 0}
- Status Breakdown: ${JSON.stringify(statusCounts)}
- Contacts with Notes: ${new Set(notesData?.map(n => n.lead_id)).size || 0}
- Emails Sent: ${emailData?.filter(e => e.sent_at).length || 0}

Current Date: ${new Date().toISOString().split('T')[0]}

Contact Details:
${leads?.slice(0, 50).map(lead => {
  const noteCount = notesData?.filter(n => n.lead_id === lead.id).length || 0;
  const emailCount = emailData?.filter(e => e.lead_id === lead.id).length || 0;
  const lastEmailOpened = emailData?.find(e => e.lead_id === lead.id && e.opened_at);
  
  return `
- ${lead.business_name} (ID: ${lead.id})
  Status: ${lead.contact_status}
  Rating: ${lead.rating || 'N/A'} (${lead.review_count || 0} reviews)
  Last Contact: ${lead.last_contacted_at || 'Never'}
  Next Follow-up: ${lead.next_follow_up_at || 'Not scheduled'}
  Notes: ${noteCount}
  Emails Sent: ${emailCount}
  Email Engagement: ${lastEmailOpened ? 'Opened' : 'Not opened'}
  Location: ${lead.city}, ${lead.state || ''}
  Niche: ${lead.niche}
  Tags: ${lead.tags?.join(', ') || 'None'}
`;
}).join('\n')}
`;

    const systemPrompt = `You are an AI CRM assistant for NichePerQ, a referral network platform.

Your role is to help users:
1. Find contacts they should prioritize
2. Suggest next actions based on contact status and history
3. Analyze pipeline health
4. Answer questions about their contacts

Guidelines:
- Be concise but actionable
- Always provide specific contact recommendations with reasoning
- Consider recency, engagement, rating, and status
- Suggest concrete next steps
- Prioritize overdue follow-ups and high-rated contacts

When recommending contacts, provide:
- Contact ID, business name
- Priority level (high/medium/low)
- Suggested action
- Brief reasoning

${context}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'answer_crm_question',
            description: 'Provide an answer to the user\'s CRM question with contact recommendations',
            parameters: {
              type: 'object',
              properties: {
                answer: {
                  type: 'string',
                  description: 'Natural language answer to the user question'
                },
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      business_name: { type: 'string' },
                      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                      suggested_action: { type: 'string' },
                      reasoning: { type: 'string' }
                    },
                    required: ['id', 'business_name', 'priority', 'suggested_action', 'reasoning']
                  },
                  description: 'List of relevant contacts with recommendations'
                },
                summary_stats: {
                  type: 'object',
                  description: 'Any relevant statistics or insights'
                }
              },
              required: ['answer']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'answer_crm_question' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI API request failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Enrich contact data with full details
    if (result.contacts && Array.isArray(result.contacts)) {
      result.contacts = result.contacts.map((contact: any) => {
        const fullContact = leads?.find(l => l.id === contact.id);
        return {
          ...contact,
          ...(fullContact ? {
            contact_status: fullContact.contact_status,
            rating: fullContact.rating,
            phone: fullContact.phone,
            website: fullContact.website,
            city: fullContact.city,
            state: fullContact.state,
            niche: fullContact.niche
          } : {})
        };
      });
    }

    // Save to chat history
    const { error: saveError } = await supabase
      .from('ai_chat_messages')
      .insert({
        user_id: user.id,
        message: question,
        response: result.answer,
        context: { contacts: result.contacts, stats: result.summary_stats }
      });

    if (saveError) {
      console.error('Error saving chat message:', saveError);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-crm-assistant:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
