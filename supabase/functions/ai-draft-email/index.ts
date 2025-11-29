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

    const { lead_id, email_type = 'initial', tone = 'professional' } = await req.json();

    // Fetch lead data
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError) throw leadError;

    // Fetch contact notes
    const { data: notes } = await supabaseClient
      .from('contact_notes')
      .select('note_text, created_at')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, company')
      .eq('id', user.id)
      .single();

    // Build context for AI
    const context = `
Business: ${lead.business_name}
Niche: ${lead.niche}
Location: ${lead.city}${lead.state ? ', ' + lead.state : ''}
Phone: ${lead.phone || 'Not available'}
Website: ${lead.website || 'Not available'}
Rating: ${lead.rating || 'Not available'} (${lead.review_count || 0} reviews)
Current Status: ${lead.contact_status}

Recent Notes:
${notes?.map(n => `- ${n.note_text}`).join('\n') || 'No notes yet'}

Your Info:
Name: ${profile?.full_name || 'User'}
Company: ${profile?.company || 'Your company'}
`;

    const systemPrompt = `You are a professional email writer for a real estate referral network. Your job is to draft personalized outreach emails to potential referral partners.

Key Guidelines:
- Be ${tone} in tone
- Keep emails concise (under 150 words)
- Focus on mutual benefit and partnership
- Include a clear call-to-action
- Personalize based on the business context
- Avoid being too salesy or pushy

Email Type: ${email_type}
${email_type === 'initial' ? '- Introduce yourself and propose a referral partnership' : ''}
${email_type === 'follow_up' ? '- Follow up on previous outreach, add value' : ''}
${email_type === 'meeting_request' ? '- Request a brief meeting/call to discuss partnership' : ''}
`;

    const userPrompt = `Draft an email to ${lead.business_name}. Here's the context:\n\n${context}`;

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
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_email',
            description: 'Create a structured email with subject and body',
            parameters: {
              type: 'object',
              properties: {
                subject: { type: 'string', description: 'Email subject line (max 60 chars)' },
                body: { type: 'string', description: 'Email body content' }
              },
              required: ['subject', 'body']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_email' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    const emailData = JSON.parse(toolCall.function.arguments);

    // Save draft to database
    const { data: draft, error: draftError } = await supabaseClient
      .from('ai_email_drafts')
      .insert({
        user_id: user.id,
        lead_id,
        subject: emailData.subject,
        body: emailData.body,
        tone,
        status: 'draft'
      })
      .select()
      .single();

    if (draftError) throw draftError;

    // Log the action
    await supabaseClient
      .from('ai_automation_logs')
      .insert({
        user_id: user.id,
        lead_id,
        action_type: 'email_drafted',
        ai_decision: { email_type, tone, model: 'gpt-4o-mini' },
        success: true
      });

    return new Response(JSON.stringify(draft), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error drafting email:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});