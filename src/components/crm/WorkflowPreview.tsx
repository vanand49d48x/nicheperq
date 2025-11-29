import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Mail, Clock, GitBranch, Target, Sparkles, Loader2 } from "lucide-react";

interface WorkflowPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
}

export default function WorkflowPreview({
  open,
  onOpenChange,
  workflowId,
  workflowName,
}: WorkflowPreviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const generatePreview = async () => {
    try {
      console.log('[WorkflowPreview] Starting preview generation for workflow:', workflowId);
      setLoading(true);

      // Fetch workflow steps
      console.log('[WorkflowPreview] Fetching workflow steps...');
      const { data: steps, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_order');

      console.log('[WorkflowPreview] Steps query result:', { steps, error: stepsError });

      if (stepsError) {
        console.error('[WorkflowPreview] Error fetching steps:', stepsError);
        throw stepsError;
      }

      if (!steps || steps.length === 0) {
        console.warn('[WorkflowPreview] No steps found for workflow');
        toast({
          title: "No Steps Found",
          description: "This workflow has no steps to preview",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('[WorkflowPreview] Found', steps.length, 'steps');

      // Get a sample lead (optional - workflow can still preview without one)
      const { data: { user } } = await supabase.auth.getUser();
      
      let sampleLead = null;
      if (user) {
        console.log('[WorkflowPreview] Fetching sample lead...');
        const { data } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        
        sampleLead = data;
        console.log('[WorkflowPreview] Sample lead:', sampleLead ? 'Found' : 'Not found');
      }

      // Calculate workflow timeline
      console.log('[WorkflowPreview] Building timeline...');
      let currentDay = 0;
      const timeline = steps.map((step, index) => {
        currentDay += step.delay_days || 0;
        return {
          step: index + 1,
          day: currentDay,
          action: step.action_type,
          details: getStepDetails(step),
        };
      });

      const previewData = {
        steps,
        sampleLead,
        timeline,
        totalDays: currentDay,
      };

      console.log('[WorkflowPreview] Preview generated successfully:', previewData);
      setPreview(previewData);
    } catch (error) {
      console.error('[WorkflowPreview] Preview generation failed:', error);
      toast({
        title: "Preview Failed",
        description: error instanceof Error ? error.message : "Could not generate workflow preview",
        variant: "destructive",
      });
    } finally {
      console.log('[WorkflowPreview] Setting loading to false');
      setLoading(false);
    }
  };

  const getStepDetails = (step: any) => {
    switch (step.action_type) {
      case 'send_email':
      case 'email':
        return {
          icon: Mail,
          label: 'Send Email',
          color: 'text-primary',
          description: `${step.email_type || 'follow_up'} email with ${step.tone || 'professional'} tone`,
        };
      case 'wait':
      case 'delay':
        return {
          icon: Clock,
          label: 'Wait',
          color: 'text-accent',
          description: `Wait ${step.delay_days} day${step.delay_days !== 1 ? 's' : ''}`,
        };
      case 'condition':
        return {
          icon: GitBranch,
          label: 'Condition Check',
          color: 'text-yellow-500',
          description: `Check if ${step.condition_type}`,
        };
      case 'update_status':
      case 'status':
        return {
          icon: Target,
          label: 'Update Status',
          color: 'text-green-500',
          description: `Move lead to ${step.next_status}`,
        };
      default:
        return {
          icon: Sparkles,
          label: step.action_type,
          color: 'text-muted-foreground',
          description: 'Custom action',
        };
    }
  };

  const handleOpen = (isOpen: boolean) => {
    console.log('[WorkflowPreview] Dialog open state changed:', { isOpen, hasPreview: !!preview });
    if (isOpen) {
      // Always generate fresh preview when opening
      console.log('[WorkflowPreview] Triggering preview generation...');
      generatePreview();
    } else {
      // Reset preview when closing
      console.log('[WorkflowPreview] Resetting preview state');
      setPreview(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Workflow Preview: {workflowName}
          </DialogTitle>
          <DialogDescription>
            See how this workflow will execute with sample lead data
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating preview...</p>
          </div>
        ) : preview ? (
          <div className="space-y-6">
            {/* Sample Lead Info */}
            {preview.sampleLead && (
              <Card className="bg-accent/30 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Sample Lead</h4>
                      <p className="text-sm">{preview.sampleLead.business_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preview.sampleLead.city}{preview.sampleLead.state ? `, ${preview.sampleLead.state}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Status: {preview.sampleLead.contact_status || 'new'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workflow Timeline */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Workflow Timeline</h4>
                <Badge className="bg-gradient-primary">
                  {preview.totalDays} days total
                </Badge>
              </div>

              <div className="space-y-3 relative">
                {/* Timeline connector line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                {preview.timeline.map((item: any, index: number) => {
                  const details = item.details;
                  const Icon = details.icon;

                  return (
                    <div key={index} className="relative flex items-start gap-4 pl-12">
                      {/* Step indicator */}
                      <div className="absolute left-0 w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold z-10">
                        {item.step}
                      </div>

                      {/* Step content */}
                      <Card className="flex-1">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${details.color}`} />
                              <span className="font-medium text-sm">{details.label}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Day {item.day}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {details.description}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5" />
                  <h4 className="font-semibold">Workflow Summary</h4>
                </div>
                <p className="text-sm opacity-90">
                  This workflow will execute {preview.steps.length} steps over {preview.totalDays} days. 
                  Emails will be sent automatically based on your configured schedule and business hours.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No preview available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
