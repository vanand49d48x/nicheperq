import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Zap, Mail, Clock, TrendingUp, Bell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrchestrationConfig {
  autoEnrollNewLeads: boolean;
  autoAnalyzeLeads: boolean;
  replyDetection: boolean;
  inactivityMonitoring: boolean;
  inactivityDays: number;
  dailyDigest: boolean;
  digestTime: string;
  statusTriggeredWorkflows: boolean;
}

export default function OrchestrationSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<OrchestrationConfig>({
    autoEnrollNewLeads: true,
    autoAnalyzeLeads: true,
    replyDetection: true,
    inactivityMonitoring: true,
    inactivityDays: 7,
    dailyDigest: true,
    digestTime: '08:00',
    statusTriggeredWorkflows: true,
  });

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('orchestration-config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('orchestration-config', JSON.stringify(config));
    toast({
      title: "Settings Saved",
      description: "Orchestration settings have been updated",
    });
  };

  const updateConfig = (key: keyof OrchestrationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Orchestration Settings</h2>
        <p className="text-muted-foreground">
          Configure how AI systems work together to automate your CRM workflow
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Auto-Enrollment</CardTitle>
          </div>
          <CardDescription>
            Automatically enroll new leads into appropriate workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-enroll">Enable Auto-Enrollment</Label>
              <p className="text-sm text-muted-foreground">
                New leads will be automatically added to matching workflows based on their properties
              </p>
            </div>
            <Switch
              id="auto-enroll"
              checked={config.autoEnrollNewLeads}
              onCheckedChange={(checked) => updateConfig('autoEnrollNewLeads', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="status-workflows">Status-Triggered Workflows</Label>
              <p className="text-sm text-muted-foreground">
                Trigger workflows when lead status changes
              </p>
            </div>
            <Switch
              id="status-workflows"
              checked={config.statusTriggeredWorkflows}
              onCheckedChange={(checked) => updateConfig('statusTriggeredWorkflows', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>AI Analysis</CardTitle>
          </div>
          <CardDescription>
            Automatic lead scoring and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-analyze">Auto-Analyze New Leads</Label>
              <p className="text-sm text-muted-foreground">
                Automatically run AI analysis on new and updated leads
              </p>
            </div>
            <Switch
              id="auto-analyze"
              checked={config.autoAnalyzeLeads}
              onCheckedChange={(checked) => updateConfig('autoAnalyzeLeads', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Intelligence</CardTitle>
          </div>
          <CardDescription>
            Smart reply detection and automated responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reply-detection">Reply Detection</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect email replies and advance workflows
              </p>
            </div>
            <Switch
              id="reply-detection"
              checked={config.replyDetection}
              onCheckedChange={(checked) => updateConfig('replyDetection', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Inactivity Monitoring</CardTitle>
          </div>
          <CardDescription>
            Re-engage leads that have gone quiet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="inactivity">Enable Inactivity Monitoring</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect inactive leads and trigger re-engagement
              </p>
            </div>
            <Switch
              id="inactivity"
              checked={config.inactivityMonitoring}
              onCheckedChange={(checked) => updateConfig('inactivityMonitoring', checked)}
            />
          </div>

          {config.inactivityMonitoring && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="inactivity-days">Inactivity Threshold</Label>
                <Select
                  value={config.inactivityDays.toString()}
                  onValueChange={(value) => updateConfig('inactivityDays', parseInt(value))}
                >
                  <SelectTrigger id="inactivity-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Trigger re-engagement after this many days without contact
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Daily Digest</CardTitle>
          </div>
          <CardDescription>
            Receive daily email summaries with AI-powered priorities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="daily-digest">Enable Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a daily email with priority actions and insights
              </p>
            </div>
            <Switch
              id="daily-digest"
              checked={config.dailyDigest}
              onCheckedChange={(checked) => updateConfig('dailyDigest', checked)}
            />
          </div>

          {config.dailyDigest && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="digest-time">Delivery Time</Label>
                <Select
                  value={config.digestTime}
                  onValueChange={(value) => updateConfig('digestTime', value)}
                >
                  <SelectTrigger id="digest-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="06:00">6:00 AM</SelectItem>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {Object.values(config).filter(v => v === true).length} features enabled
          </Badge>
        </div>
      </div>
    </div>
  );
}