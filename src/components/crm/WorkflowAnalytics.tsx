import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MousePointerClick, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  BarChart3,
  ArrowUp,
  ArrowDown,
  Trophy
} from "lucide-react";

interface WorkflowMetrics {
  workflowId: string;
  workflowName: string;
  isActive: boolean;
  totalEnrollments: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  conversions: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  conversionRate: number;
}

interface AggregateMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  totalEnrollments: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalEmailsReplied: number;
  totalConversions: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgReplyRate: number;
  avgConversionRate: number;
}

export default function WorkflowAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [aggregateMetrics, setAggregateMetrics] = useState<AggregateMetrics | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all workflows
      const { data: workflows, error: workflowsError } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('user_id', user.id);

      if (workflowsError) throw workflowsError;

      // Get enrollment metrics for each workflow
      const metricsPromises = (workflows || []).map(async (workflow) => {
        const { data: enrollments } = await supabase
          .from('workflow_enrollments')
          .select('*')
          .eq('workflow_id', workflow.id)
          .eq('user_id', user.id);

        const totalEnrollments = enrollments?.length || 0;
        const emailsSent = enrollments?.reduce((sum, e) => sum + (e.emails_sent || 0), 0) || 0;
        const emailsOpened = enrollments?.reduce((sum, e) => sum + (e.emails_opened || 0), 0) || 0;
        const emailsClicked = enrollments?.reduce((sum, e) => sum + (e.emails_clicked || 0), 0) || 0;
        const emailsReplied = enrollments?.reduce((sum, e) => sum + (e.emails_replied || 0), 0) || 0;
        const conversions = enrollments?.filter(e => e.converted).length || 0;

        const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
        const clickRate = emailsSent > 0 ? (emailsClicked / emailsSent) * 100 : 0;
        const replyRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;
        const conversionRate = totalEnrollments > 0 ? (conversions / totalEnrollments) * 100 : 0;

        return {
          workflowId: workflow.id,
          workflowName: workflow.name,
          isActive: workflow.is_active,
          totalEnrollments,
          emailsSent,
          emailsOpened,
          emailsClicked,
          emailsReplied,
          conversions,
          openRate,
          clickRate,
          replyRate,
          conversionRate,
        };
      });

      const metrics = await Promise.all(metricsPromises);
      setWorkflowMetrics(metrics);

      // Calculate aggregate metrics
      const aggregate: AggregateMetrics = {
        totalWorkflows: workflows?.length || 0,
        activeWorkflows: workflows?.filter(w => w.is_active).length || 0,
        totalEnrollments: metrics.reduce((sum, m) => sum + m.totalEnrollments, 0),
        totalEmailsSent: metrics.reduce((sum, m) => sum + m.emailsSent, 0),
        totalEmailsOpened: metrics.reduce((sum, m) => sum + m.emailsOpened, 0),
        totalEmailsClicked: metrics.reduce((sum, m) => sum + m.emailsClicked, 0),
        totalEmailsReplied: metrics.reduce((sum, m) => sum + m.emailsReplied, 0),
        totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
        avgOpenRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.openRate, 0) / metrics.length : 0,
        avgClickRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.clickRate, 0) / metrics.length : 0,
        avgReplyRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.replyRate, 0) / metrics.length : 0,
        avgConversionRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length : 0,
      };

      setAggregateMetrics(aggregate);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Could not load workflow analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 30) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 20) return <Badge className="bg-blue-500">Good</Badge>;
    if (rate >= 10) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="secondary">Needs Work</Badge>;
  };

  const getRateColor = (rate: number) => {
    if (rate >= 30) return "text-green-600 dark:text-green-400";
    if (rate >= 20) return "text-blue-600 dark:text-blue-400";
    if (rate >= 10) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!aggregateMetrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No workflow data available</p>
        </CardContent>
      </Card>
    );
  }

  const bestPerforming = [...workflowMetrics]
    .filter(w => w.emailsSent > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Aggregate Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalEmailsSent}</div>
            <p className="text-xs text-muted-foreground">
              Across {aggregateMetrics.activeWorkflows} active workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRateColor(aggregateMetrics.avgOpenRate)}`}>
              {aggregateMetrics.avgOpenRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregateMetrics.totalEmailsOpened} of {aggregateMetrics.totalEmailsSent} opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Reply Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRateColor(aggregateMetrics.avgReplyRate)}`}>
              {aggregateMetrics.avgReplyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregateMetrics.totalEmailsReplied} replies received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRateColor(aggregateMetrics.avgConversionRate)}`}>
              {aggregateMetrics.avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregateMetrics.totalConversions} conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Journey from enrollment to conversion across all workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enrolled Leads
              </span>
              <span className="font-semibold">{aggregateMetrics.totalEnrollments}</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails Sent
              </span>
              <span className="font-semibold">{aggregateMetrics.totalEmailsSent}</span>
            </div>
            <Progress 
              value={aggregateMetrics.totalEnrollments > 0 
                ? (aggregateMetrics.totalEmailsSent / aggregateMetrics.totalEnrollments) * 100 
                : 0
              } 
              className="h-2" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4" />
                Emails Opened
              </span>
              <span className="font-semibold">{aggregateMetrics.totalEmailsOpened}</span>
            </div>
            <Progress 
              value={aggregateMetrics.totalEnrollments > 0 
                ? (aggregateMetrics.totalEmailsOpened / aggregateMetrics.totalEnrollments) * 100 
                : 0
              } 
              className="h-2" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Replies Received
              </span>
              <span className="font-semibold">{aggregateMetrics.totalEmailsReplied}</span>
            </div>
            <Progress 
              value={aggregateMetrics.totalEnrollments > 0 
                ? (aggregateMetrics.totalEmailsReplied / aggregateMetrics.totalEnrollments) * 100 
                : 0
              } 
              className="h-2" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversions
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {aggregateMetrics.totalConversions}
              </span>
            </div>
            <Progress 
              value={aggregateMetrics.totalEnrollments > 0 
                ? (aggregateMetrics.totalConversions / aggregateMetrics.totalEnrollments) * 100 
                : 0
              } 
              className="h-2 bg-green-200 dark:bg-green-900" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Best Performing Workflows */}
      {bestPerforming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performing Workflows
            </CardTitle>
            <CardDescription>
              Workflows with the highest conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bestPerforming.map((workflow, index) => (
                <div key={workflow.workflowId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{workflow.workflowName}</div>
                      <div className="text-xs text-muted-foreground">
                        {workflow.totalEnrollments} enrollments • {workflow.emailsSent} emails sent
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getRateColor(workflow.conversionRate)}`}>
                      {workflow.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">conversion rate</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Workflows Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Workflows Dashboard</CardTitle>
          <CardDescription>
            Performance metrics for all your workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Workflow</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Enrolled</th>
                  <th className="text-right p-3 font-semibold">Sent</th>
                  <th className="text-right p-3 font-semibold">Open Rate</th>
                  <th className="text-right p-3 font-semibold">Reply Rate</th>
                  <th className="text-right p-3 font-semibold">Conversions</th>
                  <th className="text-right p-3 font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody>
                {workflowMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No workflows found
                    </td>
                  </tr>
                ) : (
                  workflowMetrics.map((workflow) => (
                    <tr key={workflow.workflowId} className="border-b hover:bg-accent/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{workflow.workflowName}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={workflow.isActive ? "default" : "secondary"}>
                          {workflow.isActive ? "Active" : "Paused"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{workflow.totalEnrollments}</td>
                      <td className="p-3 text-right">{workflow.emailsSent}</td>
                      <td className="p-3 text-right">
                        <span className={getRateColor(workflow.openRate)}>
                          {workflow.openRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={getRateColor(workflow.replyRate)}>
                          {workflow.replyRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {workflow.conversions}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({workflow.conversionRate.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {workflow.emailsSent > 0 ? getPerformanceBadge(workflow.conversionRate) : (
                          <Badge variant="outline">No Data</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
