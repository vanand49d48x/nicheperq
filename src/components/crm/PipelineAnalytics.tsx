import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Target, Mail, Clock, Zap, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  overview: {
    totalLeads: number;
    statusCounts: Record<string, number>;
    conversionRates: Record<string, number>;
  };
  nichePerformance: Array<{
    niche: string;
    total: number;
    closed: number;
    conversionRate: number;
    avgQualityScore: number;
    avgIntentScore: number;
  }>;
  emailPerformance: {
    totalSent: number;
    totalOpened: number;
    totalReplied: number;
    openRate: number;
    replyRate: number;
  };
  stageVelocity: Record<string, number>;
  workflowStats: {
    active: number;
    completed: number;
  };
  aiRecommendations: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

interface PipelineAnalyticsProps {
  cachedData?: AnalyticsData | null;
}

export default function PipelineAnalytics({ cachedData }: PipelineAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(cachedData || null);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setAnalytics(cachedData);
      setLoading(false);
    }
  }, [cachedData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertDescription>Failed to load analytics data</AlertDescription>
      </Alert>
    );
  }

  const funnelData = [
    { stage: 'New', count: analytics.overview.statusCounts.new, rate: 100 },
    { stage: 'Contacted', count: analytics.overview.statusCounts.contacted, rate: analytics.overview.conversionRates.newToContacted },
    { stage: 'Qualified', count: analytics.overview.statusCounts.qualified, rate: analytics.overview.conversionRates.contactedToQualified },
    { stage: 'Proposal', count: analytics.overview.statusCounts.proposal, rate: analytics.overview.conversionRates.qualifiedToProposal },
    { stage: 'Closed', count: analytics.overview.statusCounts.closed, rate: analytics.overview.conversionRates.proposalToClosed },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.statusCounts.closed} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.emailPerformance.openRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.emailPerformance.totalOpened} / {analytics.emailPerformance.totalSent} emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.emailPerformance.replyRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.emailPerformance.totalReplied} replies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.workflowStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.workflowStats.completed} completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="niches">Niche Performance</TabsTrigger>
          <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Conversion Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} name="Conversion %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Niche Performance Comparison</CardTitle>
              <CardDescription>Top performing niches by conversion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.nichePerformance.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="niche" width={150} />
                  <Tooltip />
                  <Bar dataKey="conversionRate" fill="hsl(var(--primary))" name="Conversion %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Niche Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.nichePerformance.slice(0, 6)}
                    dataKey="total"
                    nameKey="niche"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {analytics.nichePerformance.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stage Bottleneck Analysis</CardTitle>
              <CardDescription>Identify where leads get stuck</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelData.slice(0, -1).map((stage, index) => {
                const nextStage = funnelData[index + 1];
                const dropoff = stage.count - nextStage.count;
                const dropoffRate = stage.count > 0 ? (dropoff / stage.count * 100) : 0;
                const isBottleneck = dropoffRate > 50;

                return (
                  <div key={stage.stage} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {isBottleneck ? (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <h4 className="font-medium">{stage.stage} → {nextStage.stage}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dropoff} leads dropped ({dropoffRate.toFixed(1)}% loss)
                        </p>
                      </div>
                    </div>
                    {isBottleneck && (
                      <span className="text-sm font-medium text-destructive">⚠️ Bottleneck</span>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Performance Issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.emailPerformance.openRate < 20 && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Low open rate detected ({analytics.emailPerformance.openRate.toFixed(1)}%). 
                    Consider improving subject lines or send timing.
                  </AlertDescription>
                </Alert>
              )}
              {analytics.emailPerformance.replyRate < 5 && (
                <Alert>
                  <TrendingDown className="h-4 w-4" />
                  <AlertDescription>
                    Low reply rate ({analytics.emailPerformance.replyRate.toFixed(1)}%). 
                    Review email content and calls-to-action.
                  </AlertDescription>
                </Alert>
              )}
              {analytics.emailPerformance.openRate >= 20 && analytics.emailPerformance.replyRate >= 5 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Email performance looks good! Keep up the current strategy.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Actionable insights to improve your sales process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground">
                  {analytics.aiRecommendations}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Wins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.overview.statusCounts.new > analytics.overview.statusCounts.contacted && (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertDescription>
                    You have {analytics.overview.statusCounts.new} new leads waiting. 
                    Set up an automated workflow to contact them quickly.
                  </AlertDescription>
                </Alert>
              )}
              {analytics.nichePerformance.length > 3 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Focus on top 3 niches: {analytics.nichePerformance.slice(0, 3).map(n => n.niche).join(', ')}. 
                    They have the highest conversion rates.
                  </AlertDescription>
                </Alert>
              )}
              {analytics.workflowStats.active === 0 && analytics.overview.totalLeads > 10 && (
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Activate workflows to automate follow-ups and save time on manual outreach.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}