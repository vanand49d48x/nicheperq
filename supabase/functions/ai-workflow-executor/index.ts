import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Starting workflow execution check...');

    // Get all active enrollments where next_action_at is due
    const now = new Date().toISOString();
    const { data: enrollments, error: enrollmentsError } = await supabaseClient
      .from('workflow_enrollments')
      .select(`
        *,
        workflow:ai_workflows(*),
        lead:leads(*)
      `)
      .eq('status', 'active')
      .lte('next_action_at', now)
      .limit(20);  // Process 20 at a time to avoid overload

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      throw enrollmentsError;
    }

    let actionsExecuted = 0;
    let emailsSent = 0;
    const MAX_EMAILS_PER_RUN = 10;  // Rate limit: max 10 emails per execution

    for (const enrollment of enrollments || []) {
      try {
        // Get current step
        const { data: currentStep, error: stepError } = await supabaseClient
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', enrollment.workflow_id)
          .eq('step_order', enrollment.current_step_order)
          .single();

        if (stepError || !currentStep) {
          console.log('No more steps, completing enrollment');
          await supabaseClient
            .from('workflow_enrollments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', enrollment.id);
          continue;
        }

        // Check branching conditions
        let shouldExecute = true;
        let nextStepOrder = enrollment.current_step_order + 1;

        if (currentStep.condition_type && currentStep.condition_type !== 'none') {
          const conditionMet = await evaluateCondition(
            supabaseClient,
            enrollment.lead_id,
            currentStep.condition_type,
            currentStep.condition_value
          );

          if (conditionMet && currentStep.branch_to_step_order) {
            nextStepOrder = currentStep.branch_to_step_order;
            console.log(`Condition met, branching to step ${nextStepOrder}`);
          } else if (!conditionMet) {
            console.log('Condition not met, skipping to next step');
          }
        }

        // Execute step action
        if (shouldExecute) {
          const emailSent = await executeStepAction(
            supabaseClient,
            enrollment,
            currentStep,
            enrollment.lead,
            enrollment.workflow,
            emailsSent < MAX_EMAILS_PER_RUN
          );
          actionsExecuted++;
          if (emailSent) emailsSent++;
        }

        // Move to next step
        const { data: nextStep } = await supabaseClient
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', enrollment.workflow_id)
          .eq('step_order', nextStepOrder)
          .maybeSingle();

        if (nextStep) {
          const nextActionAt = new Date();
          nextActionAt.setDate(nextActionAt.getDate() + (nextStep.delay_days || 0));

          await supabaseClient
            .from('workflow_enrollments')
            .update({
              current_step_order: nextStepOrder,
              next_action_at: nextActionAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', enrollment.id);

          console.log(`Moved to step ${nextStepOrder}, next action at ${nextActionAt.toISOString()}`);
        } else {
          // No more steps, complete enrollment
          await supabaseClient
            .from('workflow_enrollments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', enrollment.id);

          console.log('Workflow completed for lead', enrollment.lead_id);
        }

      } catch (error) {
        console.error('Error executing workflow step:', error);
        await supabaseClient
          .from('workflow_enrollments')
          .update({
            status: 'failed',
            metadata: {
              ...(enrollment.metadata as any),
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', enrollment.id);
      }
    }

    console.log(`✅ Execution complete. Executed ${actionsExecuted} actions, sent ${emailsSent} emails.`);

    return new Response(JSON.stringify({ 
      success: true, 
      actions_executed: actionsExecuted,
      emails_sent: emailsSent,
      enrollments_processed: enrollments?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-workflow-executor:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function evaluateCondition(
  supabase: any,
  leadId: string,
  conditionType: string,
  conditionValue: string | null
): Promise<boolean> {
  try {
    switch (conditionType) {
      case 'email_opened': {
        const { data } = await supabase
          .from('email_tracking')
          .select('email_opened_at')
          .eq('lead_id', leadId)
          .not('email_opened_at', 'is', null)
          .limit(1);
        return (data?.length || 0) > 0;
      }

      case 'email_clicked': {
        const { data } = await supabase
          .from('email_tracking')
          .select('email_clicked_at')
          .eq('lead_id', leadId)
          .not('email_clicked_at', 'is', null)
          .limit(1);
        return (data?.length || 0) > 0;
      }

      case 'email_replied': {
        const { data } = await supabase
          .from('email_tracking')
          .select('email_replied_at')
          .eq('lead_id', leadId)
          .not('email_replied_at', 'is', null)
          .limit(1);
        return (data?.length || 0) > 0;
      }

      case 'no_response': {
        const daysSince = parseInt(conditionValue || '7');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysSince);
        
        const { data } = await supabase
          .from('lead_interactions')
          .select('occurred_at')
          .eq('lead_id', leadId)
          .gte('occurred_at', cutoffDate.toISOString())
          .limit(1);
        
        return (data?.length || 0) === 0;
      }

      case 'status_equals': {
        const { data: lead } = await supabase
          .from('leads')
          .select('contact_status')
          .eq('id', leadId)
          .single();
        return lead?.contact_status === conditionValue;
      }

      default:
        return true;
    }
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

async function executeStepAction(
  supabase: any,
  enrollment: any,
  step: any,
  lead: any,
  workflow: any,
  canSendEmail: boolean = true
): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  let emailSent = false;

  switch (step.action_type) {
    case 'send_email':
    case 'email': {
      if (!LOVABLE_API_KEY || !canSendEmail) {
        console.log(`⏭️ Skipping email send (API key: ${!!LOVABLE_API_KEY}, can send: ${canSendEmail})`);
        break;
      }

      try {
        // Generate email using AI
        const context = `
Lead: ${lead.business_name}
Niche: ${lead.niche}
Location: ${lead.city}${lead.state ? ', ' + lead.state : ''}
Status: ${lead.contact_status}
Rating: ${lead.rating || 'N/A'} (${lead.review_count || 0} reviews)
Workflow: ${workflow.name}
Email Type: ${step.email_type || 'follow-up'}
Tone: ${step.tone || 'professional'}
Hint: ${step.ai_prompt_hint || 'Write a compelling email'}
        `;

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
                content: `Generate a ${step.tone || 'professional'} B2B outreach email. Keep it under 150 words, personalized, and include a clear call-to-action.` 
              },
              { role: 'user', content: context }
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

        if (!aiResponse.ok) {
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices[0].message.tool_calls?.[0];
        const emailData = JSON.parse(toolCall.function.arguments);

        // Create email draft first
        const { data: draft, error: draftError } = await supabase
          .from('ai_email_drafts')
          .insert({
            user_id: enrollment.user_id,
            lead_id: lead.id,
            subject: emailData.subject,
            body: emailData.body,
            tone: step.tone || 'professional',
            status: 'draft'
          })
          .select()
          .single();

        if (draftError) throw draftError;

        // Generate recipient email (placeholder until we have real emails)
        const recipientEmail = lead.phone?.includes('@') 
          ? lead.phone 
          : `contact@${lead.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

        // Send email via workspace email account
        const emailBody = `${emailData.body}

---
This email was sent as part of a professional referral network outreach.
${lead.city}${lead.state ? ', ' + lead.state : ''}

To unsubscribe, reply with "unsubscribe".
`;

        const sendResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-workspace-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: enrollment.user_id,
            to_email: recipientEmail,
            subject: emailData.subject,
            body_text: emailBody,
            body_html: emailBody.replace(/\n/g, '<br>'),
          })
        });

        const sendResult = await sendResponse.json();

        if (sendResult.error === 'NO_EMAIL_ACCOUNT') {
          // Log that email was skipped due to missing email account
          await supabase
            .from('lead_interactions')
            .insert({
              lead_id: lead.id,
              user_id: enrollment.user_id,
              interaction_type: 'workflow_email_skipped',
              metadata: {
                workflow_id: workflow.id,
                step_order: step.step_order,
                reason: 'No verified email account configured'
              },
              occurred_at: new Date().toISOString()
            });

          console.log(`⚠️ Email skipped for lead ${lead.id} - no email account configured`);
          
          // Update draft status
          await supabase
            .from('ai_email_drafts')
            .update({
              status: 'failed',
            })
            .eq('id', draft.id);

          break;
        }

        if (!sendResponse.ok || sendResult.error) {
          throw new Error(sendResult.error || 'Failed to send email');
        }

        // Update draft status to sent
        await supabase
          .from('ai_email_drafts')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', draft.id);

        // Update lead's last_contacted_at
        await supabase
          .from('leads')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', lead.id);

        // Log email tracking
        await supabase
          .from('email_tracking')
          .insert({
            email_draft_id: draft.id,
            event_type: 'sent',
            event_data: { 
              workflow_id: workflow.id,
              recipient: recipientEmail 
            }
          });

        console.log(`📧 Sent email to ${lead.business_name} (${recipientEmail})`);
        emailSent = true;

      } catch (error) {
        console.error(`❌ Failed to send email for lead ${lead.id}:`, error);
        // Don't throw - continue with other actions
      }
      break;
    }

    case 'update_status':
    case 'status': {
      if (step.next_status) {
        await supabase
          .from('leads')
          .update({ contact_status: step.next_status })
          .eq('id', lead.id);

        await supabase
          .from('lead_interactions')
          .insert({
            lead_id: lead.id,
            user_id: enrollment.user_id,
            interaction_type: 'status_changed',
            metadata: {
              old_status: lead.contact_status,
              new_status: step.next_status,
              workflow_id: workflow.id
            },
            occurred_at: new Date().toISOString()
          });

        console.log(`Updated lead ${lead.id} status to ${step.next_status}`);
      }
      break;
    }

    case 'add_note': {
      if (step.task_description) {
        await supabase
          .from('contact_notes')
          .insert({
            lead_id: lead.id,
            user_id: enrollment.user_id,
            note_text: `[Workflow] ${step.task_description}`,
            note_type: 'ai_generated'
          });

        console.log(`Added workflow note to lead ${lead.id}`);
      }
      break;
    }

    case 'set_reminder': {
      if (step.task_title && step.delay_days) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + step.delay_days);

        await supabase
          .from('leads')
          .update({ next_follow_up_at: reminderDate.toISOString() })
          .eq('id', lead.id);

        console.log(`Set reminder for lead ${lead.id} at ${reminderDate.toISOString()}`);
      }
      break;
    }

    case 'wait':
    case 'delay': {
      console.log(`Waiting ${step.delay_days} days for lead ${lead.id}`);
      break;
    }
  }

  // Log interaction
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: lead.id,
      user_id: enrollment.user_id,
      interaction_type: `workflow_${step.action_type}`,
      metadata: {
        workflow_id: workflow.id,
        step_order: step.step_order,
        action_type: step.action_type,
        email_sent: emailSent
      },
      occurred_at: new Date().toISOString()
    });

  return emailSent;
}
