import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueData {
  mrr: number;
  activeSubscribers: number;
  revenueByPlan: { plan: string; revenue: number; subscribers: number }[];
  historicalRevenue: { month: string; revenue: number }[];
}

interface CostData {
  totalApiCalls: number;
  totalCost: number;
  averageCostPerUser: number;
  costByTier: { tier: string; calls: number; cost: number }[];
  historicalCosts: { month: string; cost: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const [revenueResponse, costResponse] = await Promise.all([
        supabase.functions.invoke("get-revenue-analytics"),
        supabase.functions.invoke("get-cost-analytics")
      ]);

      if (revenueResponse.error) throw revenueResponse.error;
      if (costResponse.error) throw costResponse.error;

      setRevenueData(revenueResponse.data);
      setCostData(costResponse.data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!revenueData || !costData) return;

    const profit = revenueData.mrr - costData.totalCost;
    const profitMargin = revenueData.mrr > 0 ? ((profit / revenueData.mrr) * 100).toFixed(2) : "0";

    const csvContent = [
      ["Metric", "Value"],
      ["Monthly Recurring Revenue (MRR)", `$${revenueData.mrr.toFixed(2)}`],
      ["Active Subscribers", revenueData.activeSubscribers],
      ["Total API Calls", costData.totalApiCalls],
      ["Total Costs", `$${costData.totalCost.toFixed(2)}`],
      ["Net Profit", `$${profit.toFixed(2)}`],
      ["Profit Margin", `${profitMargin}%`],
      [""],
      ["Revenue by Plan"],
      ["Plan", "Revenue", "Subscribers"],
      ...revenueData.revenueByPlan.map(p => [p.plan, `$${p.revenue.toFixed(2)}`, p.subscribers]),
      [""],
      ["Cost by Tier"],
      ["Tier", "API Calls", "Cost"],
      ...costData.costByTier.map(c => [c.tier, c.calls, `$${c.cost.toFixed(2)}`])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!revenueData || !costData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  const profit = revenueData.mrr - costData.totalCost;
  const profitMargin = revenueData.mrr > 0 ? ((profit / revenueData.mrr) * 100).toFixed(2) : "0";

  const combinedHistorical = revenueData.historicalRevenue.map((rev, idx) => ({
    month: rev.month,
    revenue: rev.revenue,
    cost: costData.historicalCosts[idx]?.cost || 0,
    profit: rev.revenue - (costData.historicalCosts[idx]?.cost || 0)
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Revenue, costs, and profitability metrics</p>
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
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${revenueData.mrr.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{revenueData.activeSubscribers} active subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costData.totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{costData.totalApiCalls} API calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${profit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <p className="text-xs text-muted-foreground">Revenue margin</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Costs Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs. Costs Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedHistorical}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" />
                <Line type="monotone" dataKey="cost" stroke="hsl(var(--destructive))" name="Costs" />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--accent))" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Plan & Cost by Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData.revenueByPlan}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData.revenueByPlan}
                    dataKey="revenue"
                    nameKey="plan"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.plan}: $${entry.revenue.toFixed(0)}`}
                  >
                    {revenueData.revenueByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* API Usage by Tier */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage & Costs by User Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData.costByTier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="calls" fill="hsl(var(--secondary))" name="API Calls" />
                <Bar yAxisId="right" dataKey="cost" fill="hsl(var(--destructive))" name="Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
