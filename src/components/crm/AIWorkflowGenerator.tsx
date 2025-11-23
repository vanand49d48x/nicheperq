import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface AIWorkflowGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowGenerated: (workflow: any) => void;
}

export const AIWorkflowGenerator = ({ open, onOpenChange, onWorkflowGenerated }: AIWorkflowGeneratorProps) => {
  const [goal, setGoal] = useState('');
  const [dealLength, setDealLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'direct'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast({
        title: "Goal required",
        description: "Please describe your workflow goal",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-workflow', {
        body: { goal, deal_length: dealLength, tone }
      });

      if (error) throw error;

      toast({
        title: "Workflow generated!",
        description: "AI has created a workflow for you to review and customize",
      });

      onWorkflowGenerated(data);
      onOpenChange(false);
      
      // Reset form
      setGoal('');
      setDealLength('medium');
      setTone('professional');
    } catch (error: any) {
      console.error('Error generating workflow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workflow",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Workflow With AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Workflow Goal</Label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="E.g., Cold contact revival, New lead nurture, Demo no-show follow-up"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Describe what you want this workflow to achieve
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Average Deal Length</Label>
              <Select value={dealLength} onValueChange={(value: any) => setDealLength(value)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (1-2 weeks)</SelectItem>
                  <SelectItem value="medium">Medium (1-2 months)</SelectItem>
                  <SelectItem value="long">Long (3-6 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Desired Tone</Label>
              <Select value={tone} onValueChange={(value: any) => setTone(value)} disabled={isGenerating}>
                <SelectTrigger>
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

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 AI will create a complete multi-step workflow with:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4">
              <li>• Optimized timing between touchpoints</li>
              <li>• Personalized email templates</li>
              <li>• Status updates and reminders</li>
              <li>• AI-generated content hints</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !goal.trim()}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Workflow...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Workflow
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
