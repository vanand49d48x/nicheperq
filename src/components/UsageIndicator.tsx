import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, AlertCircle } from "lucide-react";

interface UsageData {
  current: number;
  limit: number;
  remaining: number;
}

export const UsageIndicator = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [role, setRole] = useState<string>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setRole(roleData.role);
      }

      // Get monthly usage
      const { data: usageCount } = await supabase
        .rpc('get_monthly_usage', { p_user_id: user.id });

      const { data: limit } = await supabase
        .rpc('get_user_monthly_limit', { p_user_id: user.id });

      if (typeof usageCount === 'number' && typeof limit === 'number') {
        setUsage({
          current: usageCount,
          limit: limit,
          remaining: limit === -1 ? -1 : limit - usageCount,
        });
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !usage) return null;

  const isUnlimited = usage.limit === -1;
  const percentage = isUnlimited ? 0 : (usage.current / usage.limit) * 100;
  const isNearLimit = percentage > 80;

  return (
    <Card className="p-4 bg-gradient-to-br from-background to-muted/20 border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Monthly Usage</h3>
        </div>
        <Badge variant={role === 'admin' ? 'default' : role === 'pro' ? 'secondary' : 'outline'}>
          {role.toUpperCase()}
        </Badge>
      </div>

      {isUnlimited ? (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Unlimited Access</p>
          <p className="text-xs">You have unlimited lead searches</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-bold text-foreground">
              {usage.current}
            </span>
            <span className="text-sm text-muted-foreground">
              / {usage.limit} leads
            </span>
          </div>
          
          <Progress value={percentage} className="h-2 mb-2" />
          
          <div className="flex items-center justify-between text-xs">
            {isNearLimit ? (
              <div className="flex items-center gap-1 text-warning">
                <AlertCircle className="h-3 w-3" />
                <span>{usage.remaining} leads remaining</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {usage.remaining} leads remaining
              </span>
            )}
            {role === 'free' && (
              <button className="text-primary hover:underline font-medium">
                Upgrade
              </button>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
