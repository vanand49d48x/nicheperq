import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Mail, TrendingUp, Activity, Calendar, Settings } from "lucide-react";
import { format } from "date-fns";
import { AIAutomationSettings } from "./AIAutomationSettings";

interface AutomationLog {
  id: string;
  action_type: string;
  created_at: string;
  ai_decision: any;
  success: boolean;
  leads: {
    business_name: string;
  };
}

interface AIAutomationPanelProps {
  cachedData?: { logs: AutomationLog[]; stats: any } | null;
  onRefresh: () => void;
}

export const AIAutomationPanel = ({ cachedData, onRefresh }: AIAutomationPanelProps) => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    emails_drafted: 0,
    emails_sent: 0,
    status_changes: 0,
    workflows_executed: 0
  });
  const [isLoading, setIsLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setLogs(cachedData.logs);
      setStats(cachedData.stats);
      setIsLoading(false);
    }
  }, [cachedData]);


  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'email_drafted':
      case 'email_sent':
        return <Mail className="h-4 w-4" />;
      case 'status_changed':
        return <TrendingUp className="h-4 w-4" />;
      case 'workflow_executed':
        return <Activity className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      email_drafted: 'Email Drafted',
      email_sent: 'Email Sent',
      status_changed: 'Status Updated',
      task_created: 'Task Created',
      workflow_executed: 'Workflow Executed'
    };
    return labels[actionType] || actionType;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading automation data...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showSettings ? (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(false)}
            className="gap-2"
          >
            ← Back to Activity Log
          </Button>
          <AIAutomationSettings />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Emails Drafted</span>
          </div>
          <p className="text-2xl font-bold">{stats.emails_drafted}</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Emails Sent</span>
          </div>
          <p className="text-2xl font-bold">{stats.emails_sent}</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Auto-Updates</span>
          </div>
          <p className="text-2xl font-bold">{stats.status_changes}</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Workflows Run</span>
          </div>
          <p className="text-2xl font-bold">{stats.workflows_executed}</p>
          <p className="text-xs text-muted-foreground mt-1">This week</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Activity Log</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No AI activity yet</p>
              <p className="text-sm">Start using AI features to see activity here</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {getActionIcon(log.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                      {getActionLabel(log.action_type)}
                    </Badge>
                    {log.leads && (
                      <span className="text-sm font-medium truncate">
                        {log.leads.business_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
        </>
      )}
    </div>
  );
};