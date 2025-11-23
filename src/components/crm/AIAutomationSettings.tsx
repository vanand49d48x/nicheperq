import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings } from "lucide-react";

export const AIAutomationSettings = () => {
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [autoInsights, setAutoInsights] = useState(true);
  const [insightFrequency, setInsightFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [priorityThreshold, setPriorityThreshold] = useState<'high' | 'medium' | 'low'>('medium');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real implementation, this would load from a user_settings table
      // For now, we'll use localStorage as a quick solution
      const settings = localStorage.getItem(`ai_settings_${user.id}`);
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoAnalyze(parsed.autoAnalyze ?? true);
        setAutoInsights(parsed.autoInsights ?? true);
        setInsightFrequency(parsed.insightFrequency ?? 'daily');
        setPriorityThreshold(parsed.priorityThreshold ?? 'medium');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settings = {
        autoAnalyze,
        autoInsights,
        insightFrequency,
        priorityThreshold,
      };

      // Store in localStorage (in production, save to database)
      localStorage.setItem(`ai_settings_${user.id}`, JSON.stringify(settings));

      toast({
        title: "Settings saved",
        description: "AI automation preferences updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Automation Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Analyze New Leads</Label>
            <p className="text-sm text-muted-foreground">
              Automatically analyze and score new leads when they're added
            </p>
          </div>
          <Switch
            checked={autoAnalyze}
            onCheckedChange={setAutoAnalyze}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Auto-Generate Insights</Label>
            <p className="text-sm text-muted-foreground">
              Run AI analysis on your pipeline to surface opportunities
            </p>
          </div>
          <Switch
            checked={autoInsights}
            onCheckedChange={setAutoInsights}
          />
        </div>

        {autoInsights && (
          <>
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label>Insight Generation Frequency</Label>
              <Select value={insightFrequency} onValueChange={(value: any) => setInsightFrequency(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often AI should analyze your pipeline for new insights
              </p>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label>Priority Threshold</Label>
              <Select value={priorityThreshold} onValueChange={(value: any) => setPriorityThreshold(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority Only</SelectItem>
                  <SelectItem value="medium">Medium & High</SelectItem>
                  <SelectItem value="low">All Priorities</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Minimum priority level for insights and recommendations
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <p className="text-sm font-medium">📊 How AI Automation Works</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Auto-Analyze</strong>: AI evaluates lead quality, engagement potential, and priority</li>
          <li>• <strong>Auto-Insights</strong>: AI reviews your entire pipeline for patterns and opportunities</li>
          <li>• <strong>Background Tasks</strong>: All analysis runs automatically based on your settings</li>
          <li>• <strong>Smart Notifications</strong>: Get alerted about high-priority actions</li>
        </ul>
      </div>

      <Button 
        onClick={saveSettings} 
        disabled={isSaving}
        className="w-full gap-2"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Card>
  );
};
