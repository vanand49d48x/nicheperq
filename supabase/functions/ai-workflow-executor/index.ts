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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting workflow execution check...');

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
      .limit(50);

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
      throw enrollmentsError;
    }

    let actionsExecuted = 0;

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
          await executeStepAction(
            supabaseClient,
            enrollment,
            currentStep,
            enrollment.lead,
            enrollment.workflow
          );
          actionsExecuted++;
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

    console.log(`Execution complete. Executed ${actionsExecuted} actions.`);

    return new Response(JSON.stringify({ 
      success: true, 
      actions_executed: actionsExecuted,
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
  workflow: any
) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  switch (step.action_type) {
    case 'send_email': {
      if (!LOVABLE_API_KEY) break;

      // Generate email using AI
      const context = `
Lead: ${lead.business_name}
Niche: ${lead.niche}
Status: ${lead.contact_status}
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
            { role: 'system', content: `Generate a ${step.tone || 'professional'} email for this B2B lead.` },
            { role: 'user', content: context }
          ],
        }),
      });

      const aiData = await aiResponse.json();
      const emailBody = aiData.choices[0].message.content;

      // Create email draft
      await supabase
        .from('ai_email_drafts')
        .insert({
          user_id: enrollment.user_id,
          lead_id: lead.id,
          subject: `${step.email_type || 'Follow-up'} - ${lead.business_name}`,
          body: emailBody,
          tone: step.tone || 'professional',
          status: 'draft'
        });

      console.log(`Created email draft for lead ${lead.id}`);
      break;
    }

    case 'update_status': {
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

    case 'wait': {
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
        action_type: step.action_type
      },
      occurred_at: new Date().toISOString()
    });
}
