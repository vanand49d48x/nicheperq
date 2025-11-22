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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting workflow executor...');

    // Fetch all active workflows
    const { data: workflows, error: workflowsError } = await supabaseClient
      .from('ai_workflows')
      .select('*')
      .eq('is_active', true);

    if (workflowsError) throw workflowsError;

    console.log(`Found ${workflows?.length || 0} active workflows`);

    const results = [];

    for (const workflow of workflows || []) {
      try {
        // Evaluate trigger condition
        const trigger = workflow.trigger;
        
        // Find leads matching trigger criteria
        let query = supabaseClient
          .from('leads')
          .select('*')
          .eq('user_id', workflow.user_id);

        // Apply trigger filters
        if (trigger.contact_status) {
          query = query.eq('contact_status', trigger.contact_status);
        }
        if (trigger.days_since_contact) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - trigger.days_since_contact);
          query = query.lt('last_contacted_at', cutoffDate.toISOString());
        }

        const { data: matchingLeads } = await query;

        console.log(`Workflow "${workflow.name}": ${matchingLeads?.length || 0} matching leads`);

        // Execute workflow steps for each matching lead
        for (const lead of matchingLeads || []) {
          const steps = workflow.steps;

          for (const step of steps) {
            // Check if step should execute based on delay
            if (step.delay_days) {
              const lastAction = await supabaseClient
                .from('ai_automation_logs')
                .select('created_at')
                .eq('lead_id', lead.id)
                .eq('action_type', step.action)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (lastAction.data) {
                const daysSinceAction = Math.floor(
                  (Date.now() - new Date(lastAction.data.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysSinceAction < step.delay_days) {
                  continue; // Skip this step, delay not met
                }
              }
            }

            // Execute step action
            if (step.action === 'send_email') {
              // Draft email via AI
              const draftResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-draft-email`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    lead_id: lead.id,
                    email_type: step.email_type || 'follow_up',
                    tone: step.tone || 'professional'
                  })
                }
              );

              if (draftResponse.ok) {
                const draft = await draftResponse.json();
                
                // Check if auto-send is enabled (Enterprise tier)
                const { data: userRole } = await supabaseClient
                  .from('user_roles')
                  .select('crm_tier')
                  .eq('user_id', workflow.user_id)
                  .single();

                if (userRole?.crm_tier === 'enterprise' && step.auto_send) {
                  // Auto-send email
                  await fetch(
                    `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        draft_id: draft.id,
                        send_now: true
                      })
                    }
                  );
                }
              }
            } else if (step.action === 'update_status') {
              await supabaseClient
                .from('leads')
                .update({ contact_status: step.new_status })
                .eq('id', lead.id);
            } else if (step.action === 'set_reminder') {
              const reminderDate = new Date();
              reminderDate.setDate(reminderDate.getDate() + (step.days || 7));
              
              await supabaseClient
                .from('leads')
                .update({ next_follow_up_at: reminderDate.toISOString() })
                .eq('id', lead.id);
            }

            // Log action
            await supabaseClient
              .from('ai_automation_logs')
              .insert({
                user_id: workflow.user_id,
                lead_id: lead.id,
                action_type: 'workflow_executed',
                ai_decision: {
                  workflow_id: workflow.id,
                  workflow_name: workflow.name,
                  step_action: step.action
                },
                success: true
              });
          }
        }

        results.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          leads_processed: matchingLeads?.length || 0
        });

      } catch (error) {
        console.error(`Error executing workflow ${workflow.name}:`, error);
        results.push({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      workflows_executed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Workflow executor error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});