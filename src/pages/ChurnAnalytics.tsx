import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, Users, Percent, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChurnData {
  monthlyChurnRate: number;
  totalCancellations: number;
  activeSubscribers: number;
  retentionRate: number;
  cancellationsByPlan: { plan: string; count: number }[];
  cancellationReasons: { reason: string; count: number }[];
  churnTrend: { month: string; churnRate: number; cancellations: number }[];
  lifetimeValueTrend: { month: string; ltv: number }[];
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

export default function ChurnAnalytics() {
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChurnAnalytics();
  }, []);

  const fetchChurnAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await supabase.functions.invoke("get-churn-analytics");

      if (response.error) throw response.error;

      setChurnData(response.data);
    } catch (error: any) {
      console.error("Error fetching churn analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load churn analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!churnData) return;

    const csvContent = [
      ["Metric", "Value"],
      ["Monthly Churn Rate", `${churnData.monthlyChurnRate.toFixed(2)}%`],
      ["Total Cancellations", churnData.totalCancellations],
      ["Active Subscribers", churnData.activeSubscribers],
      ["Retention Rate", `${churnData.retentionRate.toFixed(2)}%`],
      [""],
      ["Cancellations by Plan"],
      ["Plan", "Count"],
      ...churnData.cancellationsByPlan.map(p => [p.plan, p.count]),
      [""],
      ["Cancellation Reasons"],
      ["Reason", "Count"],
      ...churnData.cancellationReasons.map(r => [r.reason, r.count]),
      [""],
      ["Churn Trend"],
      ["Month", "Churn Rate (%)", "Cancellations"],
      ...churnData.churnTrend.map(t => [t.month, t.churnRate.toFixed(2), t.cancellations])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `churn-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!churnData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No churn analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Churn Analytics</h1>
            <p className="text-muted-foreground">Subscription cancellations and retention metrics</p>
          </div>
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{churnData.monthlyChurnRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{churnData.totalCancellations}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{churnData.activeSubscribers}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <Percent className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{churnData.retentionRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Customer retention</p>
            </CardContent>
          </Card>
        </div>

        {/* Churn Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={churnData.churnTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Cancellations', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="churnRate" stroke="hsl(var(--destructive))" name="Churn Rate (%)" />
                <Line yAxisId="right" type="monotone" dataKey="cancellations" stroke="hsl(var(--primary))" name="Cancellations" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cancellations by Plan & Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cancellations by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnData.cancellationsByPlan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" name="Cancellations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancellation Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={churnData.cancellationReasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.reason}: ${entry.count}`}
                  >
                    {churnData.cancellationReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Customer Lifetime Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Lifetime Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={churnData.lifetimeValueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="ltv" stroke="hsl(var(--accent))" name="Avg LTV ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold">Churn Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  {churnData.monthlyChurnRate < 5 
                    ? "Your churn rate is healthy and below industry average (5%)."
                    : churnData.monthlyChurnRate < 10
                    ? "Your churn rate is moderate. Consider implementing retention strategies."
                    : "High churn rate detected. Immediate action recommended to improve retention."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Percent className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold">Retention Performance</h4>
                <p className="text-sm text-muted-foreground">
                  {churnData.retentionRate > 95 
                    ? "Excellent retention! Your customers are very satisfied."
                    : churnData.retentionRate > 85
                    ? "Good retention rate. Continue monitoring customer satisfaction."
                    : "Retention needs improvement. Consider surveying customers for feedback."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
