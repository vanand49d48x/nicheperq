import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const FreeSearchCounter = () => {
  const [searchCount, setSearchCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("free");
  const searchLimit = 5;

  useEffect(() => {
    fetchSearchCount();
  }, []);

  const fetchSearchCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData.role);
      }

      // Only show counter for free users
      if (roleData?.role !== 'free') {
        setIsLoading(false);
        return;
      }

      // Get current month's search count
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthStart = new Date(currentMonth + '-01').toISOString();

      const { data: searchData } = await supabase
        .from('free_tier_searches')
        .select('search_count')
        .eq('user_id', user.id)
        .eq('month_start', monthStart)
        .single();

      if (searchData) {
        setSearchCount(searchData.search_count);
      }
    } catch (error) {
      console.error('Error fetching search count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh counter after successful search
  useEffect(() => {
    const channel = supabase
      .channel('search-counter-refresh')
      .on('broadcast', { event: 'search-completed' }, () => {
        fetchSearchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading || userRole !== 'free') return null;

  const percentage = (searchCount / searchLimit) * 100;
  const isNearLimit = searchCount >= 4;
  const isAtLimit = searchCount >= searchLimit;

  return (
    <Card className="p-4 bg-gradient-to-br from-background to-muted/20 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Free Tier Searches</h3>
        </div>
        <Badge variant="outline">
          FREE
        </Badge>
      </div>

      <div className="flex justify-between items-baseline mb-2">
        <span className="text-2xl font-bold text-foreground">
          {searchCount}
        </span>
        <span className="text-sm text-muted-foreground">
          / {searchLimit} searches
        </span>
      </div>
      
      <Progress value={percentage} className="h-2 mb-3" />
      
      <div className="space-y-2">
        {isAtLimit ? (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-destructive">
                Search limit reached!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade to continue finding leads
              </p>
            </div>
          </div>
        ) : isNearLimit ? (
          <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {searchLimit - searchCount} search{searchLimit - searchCount !== 1 ? 'es' : ''} remaining this month
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {searchLimit - searchCount} searches remaining this month
          </p>
        )}
        
        <Link to="/settings" className="block">
          <Button size="sm" className="w-full gap-2" variant={isAtLimit ? "default" : "outline"}>
            <Zap className="h-3 w-3" />
            Upgrade for Unlimited Searches
          </Button>
        </Link>
      </div>
    </Card>
  );
};
