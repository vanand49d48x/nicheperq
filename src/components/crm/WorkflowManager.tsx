import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Edit, Trash2, Plus, Sparkles } from "lucide-react";
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
}

export default function WorkflowManager({ onCreateNew, onEditWorkflow }: WorkflowManagerProps) {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
      const { error } = await supabase
        .from('ai_workflows')
        .update({ is_active: !currentState })
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, is_active: !currentState } : w
      ));

      toast({
        title: currentState ? "Workflow Paused" : "Workflow Activated",
        description: `Workflow is now ${!currentState ? 'active' : 'paused'}`,
      });
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
    </>
  );
}
