import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, Play, Zap, Sparkles } from "lucide-react";
import { AIWorkflowGenerator } from "./AIWorkflowGenerator";

interface WorkflowStep {
  action: string;
  delay_days?: number;
  email_type?: string;
  tone?: string;
  new_status?: string;
  auto_send?: boolean;
}

export const WorkflowBuilder = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerStatus, setTriggerStatus] = useState('new');
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { action: 'send_email', delay_days: 0, email_type: 'initial', tone: 'professional' }
  ]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const { toast } = useToast();

  const addStep = () => {
    setSteps([...steps, { action: 'send_email', delay_days: 3, email_type: 'follow_up' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const saveWorkflow = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_workflows')
        .insert([{
          user_id: user.id,
          name,
          description,
          trigger: { contact_status: triggerStatus } as any,
          steps: steps as any,
          is_active: isActive
        }]);

      if (error) throw error;

      // Invalidate workflow cache to force refresh
      localStorage.removeItem('crm_workflows_data');
      
      toast({
        title: "Workflow Created!",
        description: "Your automation workflow has been created. Refreshing workflow list...",
      });

      // Reset form
      setName('');
      setDescription('');
      setSteps([{ action: 'send_email', delay_days: 0, email_type: 'initial', tone: 'professional' }]);
      
      // Trigger immediate refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('workflow-created'));
    } catch (error: any) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testWorkflow = async () => {
    if (!name.trim()) {
      toast({
        title: "Save first",
        description: "Please save the workflow before testing",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      toast({
        title: "Test mode",
        description: "In production, this would execute the workflow on matching leads in test mode (without sending actual emails)",
      });
    } catch (error: any) {
      console.error('Error testing workflow:', error);
      toast({
        title: "Error",
        description: "Failed to test workflow",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAIGenerated = (workflow: any) => {
    setName(workflow.name);
    setDescription(workflow.description);
    setSteps(workflow.steps);
    
    toast({
      title: "Workflow loaded!",
      description: "Review and customize the AI-generated workflow, then save",
    });
  };

  const loadTemplate = (template: string) => {
    switch (template) {
      case 'new_lead_nurture':
        setName('New Lead Nurture Sequence');
        setDescription('3-email sequence for new leads over 2 weeks');
        setTriggerStatus('new');
        setSteps([
          { action: 'send_email', delay_days: 0, email_type: 'initial', tone: 'professional' },
          { action: 'send_email', delay_days: 3, email_type: 'follow_up', tone: 'friendly' },
          { action: 'send_email', delay_days: 7, email_type: 'meeting_request', tone: 'direct' },
          { action: 'update_status', delay_days: 14, new_status: 'do_not_contact' }
        ]);
        break;
      case 'cold_revival':
        setName('Cold Contact Revival');
        setDescription('Re-engage contacts with no recent activity');
        setTriggerStatus('attempted');
        setSteps([
          { action: 'send_email', delay_days: 0, email_type: 'follow_up', tone: 'friendly' },
          { action: 'set_reminder', delay_days: 7 }
        ]);
        break;
    }
  };

  return (
    <>
      <AIWorkflowGenerator
        open={showAIGenerator}
        onOpenChange={setShowAIGenerator}
        onWorkflowGenerated={handleAIGenerated}
      />

    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Workflow Builder</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle" className="text-sm">Active</Label>
          <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      {/* AI Generator Button */}
      <Button 
        onClick={() => setShowAIGenerator(true)}
        variant="outline"
        className="w-full gap-2 border-dashed"
      >
        <Sparkles className="h-4 w-4" />
        ✨ Generate Workflow With AI
      </Button>

      {/* Templates */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => loadTemplate('new_lead_nurture')}>
          📧 New Lead Nurture
        </Button>
        <Button variant="outline" size="sm" onClick={() => loadTemplate('cold_revival')}>
          🔄 Cold Contact Revival
        </Button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Workflow Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New Lead Outreach Sequence"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this workflow do?"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Trigger: When contact status is</Label>
          <Select value={triggerStatus} onValueChange={setTriggerStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="attempted">Attempted</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Workflow Steps</Label>
          <Button size="sm" variant="outline" onClick={addStep} className="gap-1">
            <Plus className="h-3 w-3" />
            Add Step
          </Button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <Card key={index} className="p-4 space-y-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Step {index + 1}</Badge>
                {steps.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeStep(index)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Action</Label>
                  <Select 
                    value={step.action} 
                    onValueChange={(value) => updateStep(index, { action: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_email">Send Email</SelectItem>
                      <SelectItem value="update_status">Update Status</SelectItem>
                      <SelectItem value="set_reminder">Set Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Delay (days)</Label>
                  <Input
                    type="number"
                    value={step.delay_days || 0}
                    onChange={(e) => updateStep(index, { delay_days: parseInt(e.target.value) })}
                    className="h-8 text-sm"
                    min={0}
                  />
                </div>
              </div>

              {step.action === 'send_email' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Email Type</Label>
                    <Select 
                      value={step.email_type} 
                      onValueChange={(value) => updateStep(index, { email_type: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="meeting_request">Meeting Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Tone</Label>
                    <Select 
                      value={step.tone} 
                      onValueChange={(value) => updateStep(index, { tone: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step.action === 'update_status' && (
                <div className="space-y-2">
                  <Label className="text-xs">New Status</Label>
                  <Select 
                    value={step.new_status} 
                    onValueChange={(value) => updateStep(index, { new_status: value })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attempted">Attempted</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="in_conversation">In Conversation</SelectItem>
                      <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={saveWorkflow} disabled={isSaving} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </Button>
          <Button variant="outline" onClick={testWorkflow} disabled={isTesting} className="gap-2">
            <Play className="h-4 w-4" />
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
        </div>
      </Card>
    </>
  );
};