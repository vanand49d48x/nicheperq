import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface Insight {
  type: 'priority' | 'opportunity' | 'warning';
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
}

export const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insights: Insight[] = [];

      // Get leads needing attention
      const { data: staleLeads } = await supabase
        .from('leads')
        .select('id, business_name, last_contacted_at, contact_status')
        .eq('user_id', user.id)
        .eq('contact_status', 'attempted')
        .lt('last_contacted_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .limit(3);

      staleLeads?.forEach(lead => {
        insights.push({
          type: 'priority',
          title: 'Follow-up needed',
          description: `No contact in 14+ days`,
          leadId: lead.id,
          leadName: lead.business_name
        });
      });

      // Get highly-rated leads
      const { data: topLeads } = await supabase
        .from('leads')
        .select('id, business_name, rating, review_count')
        .eq('user_id', user.id)
        .eq('contact_status', 'new')
        .gte('rating', 4.5)
        .gte('review_count', 50)
        .limit(2);

      topLeads?.forEach(lead => {
        insights.push({
          type: 'opportunity',
          title: 'High-value prospect',
          description: `${lead.rating}★ rating with ${lead.review_count} reviews`,
          leadId: lead.id,
          leadName: lead.business_name
        });
      });

      // Get leads with upcoming follow-ups
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: upcomingFollowUps } = await supabase
        .from('leads')
        .select('id, business_name, next_follow_up_at')
        .eq('user_id', user.id)
        .not('next_follow_up_at', 'is', null)
        .lte('next_follow_up_at', tomorrow.toISOString())
        .limit(2);

      upcomingFollowUps?.forEach(lead => {
        insights.push({
          type: 'warning',
          title: 'Follow-up due soon',
          description: 'Reminder scheduled',
          leadId: lead.id,
          leadName: lead.business_name
        });
      });

      setInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'priority':
        return <AlertCircle className="h-4 w-4" />;
      case 'opportunity':
        return <TrendingUp className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'priority':
        return 'destructive';
      case 'opportunity':
        return 'default';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Analyzing contacts...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <Button variant="outline" size="sm" onClick={generateInsights}>
          Refresh
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No insights available</p>
          <p className="text-sm">Add more contacts to get AI recommendations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full bg-${insight.type === 'opportunity' ? 'primary' : insight.type === 'priority' ? 'destructive' : 'secondary'}/10`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getInsightColor(insight.type) as any} className="text-xs">
                    {insight.title}
                  </Badge>
                </div>
                {insight.leadName && (
                  <p className="text-sm font-medium mb-1">{insight.leadName}</p>
                )}
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </div>
              {insight.leadId && (
                <Button size="sm" variant="ghost" onClick={() => window.location.href = `/crm?lead=${insight.leadId}`}>
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};