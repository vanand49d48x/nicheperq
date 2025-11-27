import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load persisted insights on mount
  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const cached = localStorage.getItem('ai_insights');
      if (cached) {
        const { insights: cachedInsights, timestamp } = JSON.parse(cached);
        // Cache valid for 1 hour
        if (Date.now() - timestamp < 3600000) {
          setInsights(cachedInsights);
          return;
        }
      }
      // Auto-generate if no valid cache
      await generateInsights();
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateInsights = async () => {
    try {
      setIsLoading(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('ai-generate-insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      const newInsights = data.insights || [];
      setInsights(newInsights);
      
      // Persist to localStorage with timestamp
      localStorage.setItem('ai_insights', JSON.stringify({
        insights: newInsights,
        timestamp: Date.now()
      }));
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

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={generateInsights}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Insights
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No insights yet</p>
          <p className="text-sm">Click "Generate AI Insights" to analyze your pipeline</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                insight.leadId 
                  ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm' 
                  : 'hover:bg-muted/30'
              }`}
              onClick={() => {
                if (insight.leadId) {
                  navigate(`/crm?view=list&lead=${insight.leadId}`);
                }
              }}
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
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};