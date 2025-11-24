import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Edit, Trash2, Plus, Sparkles, TestTube } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import WorkflowTemplates from "./WorkflowTemplates";

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger: any;
  created_at: string;
  updated_at: string;
}

interface WorkflowManagerProps {
  onCreateNew: () => void;
  onEditWorkflow: (workflowId: string) => void;
  refreshTrigger?: number;
}

export default function WorkflowManager({ onCreateNew, onEditWorkflow, refreshTrigger }: WorkflowManagerProps) {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testWorkflow, setTestWorkflow] = useState<Workflow | null>(null);
  const [testPreview, setTestPreview] = useState<any>(null);
  const [testingWorkflow, setTestingWorkflow] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, [refreshTrigger]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Loaded workflows:', data?.length || 0);
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: "Error Loading Workflows",
        description: "Could not load your workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (workflowId: string, currentState: boolean) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      // Check if workflow has steps before allowing activation
      const { data: steps } = await supabase
        .from('workflow_steps')
        .select('id')
        .eq('workflow_id', workflowId);

      console.log(`Workflow ${workflowId} has ${steps?.length || 0} steps`);

      if (!steps || steps.length === 0) {
        toast({
          title: "Cannot Activate",
          description: "This workflow has no steps. Edit it and add steps first.",
          variant: "destructive",
        });
        return;
      }

      // If activating, enroll matching leads
      if (!currentState) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let enrolledCount = 0;
        const trigger = workflow.trigger as any;

        // Get first step to calculate next_action_at
        const { data: firstStep } = await supabase
          .from('workflow_steps')
          .select('*')
          .eq('workflow_id', workflowId)
          .eq('step_order', 1)
          .single();

        // Calculate next action time
        const nextActionAt = new Date();
        nextActionAt.setDate(nextActionAt.getDate() + (firstStep?.delay_days || 0));

        // Enroll leads based on trigger type
        if (trigger.type === 'inactivity') {
          // Cold Lead Revival: inactive for X days
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - (trigger.days || 14));

          const { data: inactiveLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('user_id', user.id)
            .not('contact_status', 'in', '("closed_won","closed_lost","unqualified")')
            .or(`last_contacted_at.lte.${daysAgo.toISOString()},last_contacted_at.is.null`);

          if (inactiveLeads && inactiveLeads.length > 0) {
            const enrollments = inactiveLeads.map(lead => ({
              workflow_id: workflowId,
              lead_id: lead.id,
              user_id: user.id,
              current_step_order: 1,
              next_action_at: nextActionAt.toISOString(),
              status: 'active',
              enrolled_at: new Date().toISOString()
            }));

            const { error: enrollError } = await supabase
              .from('workflow_enrollments')
              .insert(enrollments);

            if (!enrollError) enrolledCount = inactiveLeads.length;
          }
        } else if (trigger.type === 'lead_status' || trigger.type === 'status_change') {
          // New Lead Nurture or status-based triggers
          const targetStatus = trigger.value || trigger.to_status || 'new';

          const { data: matchingLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('user_id', user.id)
            .eq('contact_status', targetStatus);

          if (matchingLeads && matchingLeads.length > 0) {
            const enrollments = matchingLeads.map(lead => ({
              workflow_id: workflowId,
              lead_id: lead.id,
              user_id: user.id,
              current_step_order: 1,
              next_action_at: nextActionAt.toISOString(),
              status: 'active',
              enrolled_at: new Date().toISOString()
            }));

            const { error: enrollError } = await supabase
              .from('workflow_enrollments')
              .insert(enrollments);

            if (!enrollError) enrolledCount = matchingLeads.length;
          }
        }

        toast({
          title: "Workflow Activated!",
          description: enrolledCount > 0 
            ? `${enrolledCount} leads enrolled and workflow activated` 
            : "Workflow activated - new matching leads will be enrolled automatically",
        });
      }

      // Update workflow status
      const { error } = await supabase
        .from('ai_workflows')
        .update({ is_active: !currentState })
        .eq('id', workflowId);

      if (error) throw error;

      // Update local state without full reload
      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, is_active: !currentState } : w
      ));

      if (currentState) {
        toast({
          title: "Workflow Paused",
          description: "Workflow is now paused",
        });
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Could not update workflow status",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (workflowId: string) => {
    setWorkflowToDelete(workflowId);
    setDeleteDialogOpen(true);
  };

  const deleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      // Delete workflow steps first
      await supabase
        .from('workflow_steps')
        .delete()
        .eq('workflow_id', workflowToDelete);

      // Delete workflow
      const { error } = await supabase
        .from('ai_workflows')
        .delete()
        .eq('id', workflowToDelete);

      if (error) throw error;

      setWorkflows(workflows.filter(w => w.id !== workflowToDelete));
      toast({
        title: "Workflow Deleted",
        description: "Workflow has been removed",
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: "Error",
        description: "Could not delete workflow",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const openTestDialog = async (workflow: Workflow) => {
    setTestWorkflow(workflow);
    setTestDialogOpen(true);
    setTestingWorkflow(true);

    try {
      // Fetch workflow steps
      const { data: steps, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflow.id)
        .order('step_order');

      if (stepsError) throw stepsError;

      // Get a sample lead that matches the trigger
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const triggerValue = typeof workflow.trigger === 'object' && workflow.trigger 
        ? (workflow.trigger as any).value 
        : 'new';

      const { data: sampleLead } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_status', triggerValue)
        .limit(1)
        .single();

      setTestPreview({
        workflow,
        steps: steps || [],
        sampleLead,
        totalDays: steps?.reduce((sum, s) => sum + (s.delay_days || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: "Could not preview workflow",
        variant: "destructive",
      });
    } finally {
      setTestingWorkflow(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading workflows...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-accent/30 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">💡 How Workflows Work</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>1. Deploy a Template</strong> or create custom → <strong>2. Review/Edit</strong> in "Your Workflows" below → <strong>3. Activate</strong> to start automation
                </p>
                <p className="text-xs text-muted-foreground">
                  Once active, matching leads are automatically enrolled and emails sent on schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <WorkflowTemplates onTemplateDeployed={loadWorkflows} />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Your Workflows</CardTitle>
            <Button onClick={onCreateNew} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No workflows yet</p>
              <Button onClick={onCreateNew} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{workflow.name}</h4>
                      <Badge variant={workflow.is_active ? "default" : "secondary"}>
                        {workflow.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {workflow.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(workflow.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() => toggleActive(workflow.id, workflow.is_active)}
                      />
                      {workflow.is_active ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : (
                        <Pause className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTestDialog(workflow)}
                      title="Test workflow preview"
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditWorkflow(workflow.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workflow and all its steps. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteWorkflow} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Workflow Preview: {testWorkflow?.name}</DialogTitle>
            <DialogDescription>
              This shows what would happen when a lead matches the trigger
            </DialogDescription>
          </DialogHeader>
          
          {testingWorkflow ? (
            <div className="py-8 text-center text-muted-foreground">Loading preview...</div>
          ) : testPreview ? (
            <div className="space-y-4">
              <Card className="bg-accent/20">
                <CardContent className="pt-4">
                  <div className="text-sm">
                    <p className="font-semibold mb-2">🎯 Trigger Condition:</p>
                    <p className="text-muted-foreground">
                      When lead status is: <Badge>{(testPreview.workflow.trigger as any)?.value || 'new'}</Badge>
                    </p>
                    {testPreview.sampleLead ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        Example lead: {testPreview.sampleLead.business_name}
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-600 mt-2">
                        No matching leads found to test with
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <p className="font-semibold text-sm">📋 Workflow Steps ({testPreview.steps.length}):</p>
                {testPreview.steps.map((step: any, index: number) => (
                  <Card key={step.id} className="bg-card">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Badge className="shrink-0">Step {step.step_order}</Badge>
                        <div className="flex-1">
                          {step.action_type === 'send_email' && (
                            <>
                              <p className="font-medium">📧 Send Email</p>
                              <p className="text-sm text-muted-foreground">
                                Type: {step.email_type} • Tone: {step.tone}
                              </p>
                              {step.ai_prompt_hint && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{step.ai_prompt_hint.slice(0, 100)}..."
                                </p>
                              )}
                            </>
                          )}
                          {step.action_type === 'wait' && (
                            <>
                              <p className="font-medium">⏰ Wait</p>
                              <p className="text-sm text-muted-foreground">
                                Delay {step.delay_days} day{step.delay_days !== 1 ? 's' : ''} before next step
                              </p>
                            </>
                          )}
                          {step.action_type === 'update_status' && (
                            <>
                              <p className="font-medium">✅ Update Status</p>
                              <p className="text-sm text-muted-foreground">
                                Change lead status to: {step.next_status}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold">⏱️ Total Duration: {testPreview.totalDays} days</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Workflow takes {testPreview.totalDays} days from trigger to completion
                  </p>
                </CardContent>
              </Card>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  💡 This is a preview only. Activate the workflow for it to run automatically on matching leads.
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
