import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🎯 AI Orchestrator: Starting full system orchestration...');

    // 1. Auto-enroll new leads
    await autoEnrollNewLeads(supabase);

    // 2. Detect and process email replies
    await processEmailReplies(supabase);

    // 3. Monitor inactivity and re-engage
    await monitorInactivity(supabase);

    // 4. Process status changes
    await processStatusChanges(supabase);

    // 5. Auto-analyze leads that need scoring
    await autoAnalyzeLeads(supabase);

    console.log('✅ AI Orchestrator: Completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Orchestration completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ AI Orchestrator error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function autoEnrollNewLeads(supabase: any) {
  console.log('📥 Checking for ALL new leads to auto-enroll (no time restriction)...');
  
  // Get ALL leads with status 'new' that aren't enrolled in ANY workflow
  // IMPORTANT: Only get leads with a valid user_id
  const { data: newLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, user_id, contact_status, niche, created_at')
    .eq('contact_status', 'new')
    .not('user_id', 'is', null);

  if (leadsError) {
    console.error('Error fetching new leads:', leadsError);
    return;
  }

  if (!newLeads?.length) {
    console.log('No new leads found');
    return;
  }

  console.log(`Found ${newLeads.length} leads with status 'new'`);

  // Filter out leads that are already enrolled in any workflow
  const leadIds = newLeads.map((l: any) => l.id);
  const { data: existingEnrollments } = await supabase
    .from('workflow_enrollments')
    .select('lead_id')
    .in('lead_id', leadIds);

  const enrolledLeadIds = new Set(existingEnrollments?.map((e: any) => e.lead_id) || []);
  const unenrolledLeads = newLeads.filter((lead: any) => !enrolledLeadIds.has(lead.id));

  console.log(`${unenrolledLeads.length} leads not yet enrolled in workflows`);

  // Get active workflows with auto-enroll triggers
  const { data: workflows, error: workflowsError } = await supabase
    .from('ai_workflows')
    .select('*')
    .eq('is_active', true);

  if (workflowsError || !workflows?.length) {
    console.log('No active workflows found');
    return;
  }

  console.log(`Found ${workflows.length} active workflows`);

  let enrolledCount = 0;

  for (const lead of unenrolledLeads) {
    // Find matching workflow based on lead properties
    const matchingWorkflow = workflows.find((w: any) => {
      const trigger = w.trigger;
      if (trigger.type === 'lead_status' && trigger.value === lead.contact_status) return true;
      if (trigger.type === 'lead_status' && trigger.value === 'new' && lead.contact_status === 'new') return true;
      if (trigger.type === 'lead_imported' && lead.contact_status === 'new') return true;
      if (trigger.type === 'niche' && trigger.value === lead.niche) return true;
      return false;
    });

    if (matchingWorkflow) {
      console.log(`✅ Enrolling lead ${lead.id} (${lead.niche}) in workflow "${matchingWorkflow.name}"`);
      
      const { error: enrollError } = await supabase.from('workflow_enrollments').insert({
        lead_id: lead.id,
        workflow_id: matchingWorkflow.id,
        user_id: lead.user_id,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        current_step_order: 1,
        next_action_at: new Date().toISOString(),
      });

      if (enrollError) {
        console.error(`Failed to enroll lead ${lead.id}:`, enrollError);
      } else {
        enrolledCount++;
      }
    }
  }

  console.log(`🎉 Successfully enrolled ${enrolledCount} leads into workflows`);
}

async function processEmailReplies(supabase: any) {
  console.log('📧 Processing email replies...');

  // Get recent email tracking events for replies
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: replies, error } = await supabase
    .from('email_tracking')
    .select('*, ai_email_drafts(lead_id, user_id)')
    .eq('event_type', 'replied')
    .gte('timestamp', oneHourAgo);

  if (error || !replies?.length) return;

  console.log(`Processing ${replies.length} replies`);

  for (const reply of replies) {
    const leadId = reply.ai_email_drafts.lead_id;
    const userId = reply.ai_email_drafts.user_id;

    // Update lead status if still in early stages
    const { data: lead } = await supabase
      .from('leads')
      .select('contact_status')
      .eq('id', leadId)
      .single();

    if (lead && ['new', 'contacted', 'attempted'].includes(lead.contact_status)) {
      await supabase
        .from('leads')
        .update({ 
          contact_status: 'in_conversation',
          last_contacted_at: new Date().toISOString()
        })
        .eq('id', leadId);
    }

    // Log interaction
    await supabase.from('lead_interactions').insert({
      lead_id: leadId,
      user_id: userId,
      interaction_type: 'email_reply',
      occurred_at: reply.timestamp,
      metadata: { reply_id: reply.id }
    });

    // Check if lead is in an active workflow and advance it
    const { data: enrollment } = await supabase
      .from('workflow_enrollments')
      .select('*, ai_workflows(id, name), workflow_steps(*)')
      .eq('lead_id', leadId)
      .eq('status', 'active')
      .single();

    if (enrollment) {
      // Find next step that checks for replies
      const currentStep = enrollment.workflow_steps.find(
        (s: any) => s.step_order === enrollment.current_step_order
      );
      
      if (currentStep?.condition_type === 'reply_received') {
        const nextStep = currentStep.branch_to_step_order || enrollment.current_step_order + 1;
        await supabase
          .from('workflow_enrollments')
          .update({
            current_step_order: nextStep,
            next_action_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id);
      }
    }
  }
}

async function monitorInactivity(supabase: any) {
  console.log('⏰ Monitoring lead inactivity...');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Find leads with no recent contact
  const { data: inactiveLeads, error } = await supabase
    .from('leads')
    .select('*')
    .in('contact_status', ['contacted', 'qualified', 'in_conversation'])
    .or(`last_contacted_at.lt.${sevenDaysAgo},last_contacted_at.is.null`)
    .not('contact_status', 'eq', 'do_not_contact');

  if (error || !inactiveLeads?.length) return;

  console.log(`Found ${inactiveLeads.length} inactive leads`);

  // Find re-engagement workflows
  const { data: reengageWorkflows } = await supabase
    .from('ai_workflows')
    .select('*')
    .eq('is_active', true)
    .contains('trigger', { type: 'inactivity' });

  if (!reengageWorkflows?.length) return;

  for (const lead of inactiveLeads) {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from('workflow_enrollments')
      .select('id')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();

    if (existing) continue; // Already in a workflow

    const daysSinceContact = lead.last_contacted_at 
      ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceContact >= 7) {
      console.log(`Enrolling inactive lead ${lead.id} in re-engagement workflow`);
      
      await supabase.from('workflow_enrollments').insert({
        lead_id: lead.id,
        workflow_id: reengageWorkflows[0].id,
        user_id: lead.user_id,
        enrolled_at: new Date().toISOString(),
        status: 'active',
        current_step_order: 1,
        next_action_at: new Date().toISOString(),
        metadata: { reason: 'inactivity', days_inactive: daysSinceContact }
      });
    }
  }
}

async function processStatusChanges(supabase: any) {
  console.log('🔄 Processing status-triggered workflows...');

  // Get recent lead updates (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: recentLeads, error } = await supabase
    .from('leads')
    .select('*')
    .gte('updated_at', oneHourAgo);

  if (error || !recentLeads?.length) return;

  // Get status-triggered workflows
  const { data: workflows } = await supabase
    .from('ai_workflows')
    .select('*')
    .eq('is_active', true);

  if (!workflows?.length) return;

  for (const lead of recentLeads) {
    const matchingWorkflow = workflows.find((w: any) => 
      w.trigger.type === 'lead_status' && w.trigger.value === lead.contact_status
    );

    if (matchingWorkflow) {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('workflow_enrollments')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('workflow_id', matchingWorkflow.id)
        .single();

      if (!existing) {
        console.log(`Status change detected: Enrolling lead ${lead.id}`);
        
        await supabase.from('workflow_enrollments').insert({
          lead_id: lead.id,
          workflow_id: matchingWorkflow.id,
          user_id: lead.user_id,
          enrolled_at: new Date().toISOString(),
          status: 'active',
          current_step_order: 1,
          next_action_at: new Date().toISOString(),
        });
      }
    }
  }
}

async function autoAnalyzeLeads(supabase: any) {
  console.log('🤖 Auto-analyzing leads...');

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Find leads without recent AI analysis
  const { data: leadsToAnalyze, error } = await supabase
    .from('leads')
    .select('*')
    .or(`last_ai_analysis_at.lt.${threeDaysAgo},last_ai_analysis_at.is.null`)
    .limit(10); // Process 10 at a time

  if (error || !leadsToAnalyze?.length) return;

  console.log(`Analyzing ${leadsToAnalyze.length} leads`);

  for (const lead of leadsToAnalyze) {
    try {
      // Call AI analysis function
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-analyze-lead`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId: lead.id, userId: lead.user_id }),
      });
    } catch (error) {
      console.error(`Failed to analyze lead ${lead.id}:`, error);
    }
  }
}