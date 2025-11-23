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

    console.log('Starting workflow enrollment check...');

    // Get all active workflows
    const { data: workflows, error: workflowsError } = await supabaseClient
      .from('ai_workflows')
      .select('*')
      .eq('is_active', true);

    if (workflowsError) {
      console.error('Error fetching workflows:', workflowsError);
      throw workflowsError;
    }

    let totalEnrolled = 0;

    for (const workflow of workflows || []) {
      const trigger = workflow.trigger as any;
      
      if (!trigger || !trigger.type) continue;

      let leadsToEnroll: any[] = [];

      // Status-based triggers
      if (trigger.type === 'status_changed' && trigger.status) {
        const { data: leads } = await supabaseClient
          .from('leads')
          .select('*')
          .eq('user_id', workflow.user_id)
          .eq('contact_status', trigger.status)
          .not('id', 'in', `(
            SELECT lead_id FROM workflow_enrollments 
            WHERE workflow_id = '${workflow.id}' 
            AND status IN ('active', 'completed')
          )`);

        leadsToEnroll = leads || [];
      }

      // Inactivity-based triggers
      if (trigger.type === 'no_activity' && trigger.days_inactive) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - trigger.days_inactive);

        const { data: leads } = await supabaseClient
          .from('leads')
          .select('*')
          .eq('user_id', workflow.user_id)
          .lt('last_contacted_at', cutoffDate.toISOString())
          .not('id', 'in', `(
            SELECT lead_id FROM workflow_enrollments 
            WHERE workflow_id = '${workflow.id}' 
            AND status IN ('active', 'completed')
          )`);

        leadsToEnroll = leads || [];
      }

      // Enroll leads
      for (const lead of leadsToEnroll) {
        try {
          // Get first step to calculate next action time
          const { data: firstStep } = await supabaseClient
            .from('workflow_steps')
            .select('*')
            .eq('workflow_id', workflow.id)
            .eq('step_order', 1)
            .single();

          const nextActionAt = new Date();
          if (firstStep?.delay_days) {
            nextActionAt.setDate(nextActionAt.getDate() + firstStep.delay_days);
          }

          const { error: enrollError } = await supabaseClient
            .from('workflow_enrollments')
            .insert({
              lead_id: lead.id,
              workflow_id: workflow.id,
              user_id: workflow.user_id,
              current_step_order: 1,
              next_action_at: nextActionAt.toISOString(),
              status: 'active',
              metadata: {
                trigger_type: trigger.type,
                enrolled_at: new Date().toISOString()
              }
            });

          if (enrollError && !enrollError.message.includes('duplicate')) {
            console.error('Error enrolling lead:', enrollError);
          } else if (!enrollError) {
            totalEnrolled++;
            console.log(`Enrolled lead ${lead.id} in workflow ${workflow.name}`);

            // Log interaction
            await supabaseClient
              .from('lead_interactions')
              .insert({
                lead_id: lead.id,
                user_id: workflow.user_id,
                interaction_type: 'workflow_enrolled',
                metadata: {
                  workflow_id: workflow.id,
                  workflow_name: workflow.name
                },
                occurred_at: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error('Error enrolling lead:', error);
        }
      }
    }

    console.log(`Enrollment check complete. Enrolled ${totalEnrolled} leads.`);

    return new Response(JSON.stringify({ 
      success: true, 
      enrolled_count: totalEnrolled,
      workflows_checked: workflows?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-workflow-enroller:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
