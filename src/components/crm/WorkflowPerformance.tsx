import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, Mail, MousePointer, Reply, Target } from "lucide-react";

interface WorkflowPerformanceProps {
  workflowId: string;
}

interface PerformanceData {
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

export default function WorkflowPerformance({ workflowId }: WorkflowPerformanceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    loadPerformance();
  }, [workflowId]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      
      // Get enrollment stats
      const { data: enrollments, error: enrollError } = await supabase
        .from('workflow_enrollments')
        .select('*')
        .eq('workflow_id', workflowId);

      if (enrollError) throw enrollError;

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

      setPerformance({
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
      });
    } catch (error) {
      console.error('Error loading performance:', error);
      toast({
        title: "Error Loading Metrics",
        description: "Could not load workflow performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performance) return null;

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 30) return <Badge className="bg-green-500">Excellent</Badge>;
    if (rate >= 15) return <Badge className="bg-blue-500">Good</Badge>;
    if (rate >= 5) return <Badge className="bg-yellow-500">Average</Badge>;
    return <Badge variant="secondary">Needs Work</Badge>;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Metrics
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {performance.totalEnrollments} enrolled
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Open Rate
            </div>
            <div className="text-2xl font-bold">{performance.openRate.toFixed(1)}%</div>
            {getPerformanceBadge(performance.openRate)}
            <p className="text-xs text-muted-foreground">
              {performance.emailsOpened} / {performance.emailsSent} opened
            </p>
          </div>

          <div className="space-y-2 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MousePointer className="h-4 w-4" />
              Click Rate
            </div>
            <div className="text-2xl font-bold">{performance.clickRate.toFixed(1)}%</div>
            {getPerformanceBadge(performance.clickRate)}
            <p className="text-xs text-muted-foreground">
              {performance.emailsClicked} / {performance.emailsSent} clicked
            </p>
          </div>

          <div className="space-y-2 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="h-4 w-4" />
              Reply Rate
            </div>
            <div className="text-2xl font-bold">{performance.replyRate.toFixed(1)}%</div>
            {getPerformanceBadge(performance.replyRate)}
            <p className="text-xs text-muted-foreground">
              {performance.emailsReplied} / {performance.emailsSent} replied
            </p>
          </div>

          <div className="space-y-2 p-3 bg-gradient-primary rounded-lg text-primary-foreground">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Target className="h-4 w-4" />
              Conversion Rate
            </div>
            <div className="text-2xl font-bold">{performance.conversionRate.toFixed(1)}%</div>
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {performance.conversions} converted
            </Badge>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground bg-accent/20 p-3 rounded-lg">
          <strong>Optimization Tips:</strong> Open rates below 15% suggest subject line issues. Click rates below 5% indicate weak CTAs. Reply rates above 5% are excellent for cold outreach.
        </div>
      </CardContent>
    </Card>
  );
}
