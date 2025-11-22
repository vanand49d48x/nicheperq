import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureGateProps {
  feature: "crm" | "ai";
  children: ReactNode;
  fallback?: ReactNode;
}

export const FeatureGate = ({ feature, children, fallback }: FeatureGateProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("free");

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, has_crm_access, has_ai_access')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        
        if (feature === "crm") {
          setHasAccess(roleData.has_crm_access || false);
        } else if (feature === "ai") {
          setHasAccess(roleData.has_ai_access || false);
        }
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <div className="container max-w-4xl py-16 px-6">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {feature === "crm" ? (
              <Crown className="h-8 w-8 text-primary" />
            ) : (
              <Zap className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="text-sm">
              {feature === "crm" ? "ADVANCED+ Required" : "PRO Required"}
            </Badge>
          </div>
          <CardTitle className="text-3xl">
            {feature === "crm" ? "CRM Features Locked" : "AI Features Locked"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {feature === "crm" 
              ? "Upgrade to ADVANCED or PRO to unlock the full CRM suite"
              : "Upgrade to PRO to unlock AI-powered automation and insights"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">
              {feature === "crm" ? "What You'll Get:" : "AI Features Include:"}
            </h4>
            <ul className="space-y-2">
              {feature === "crm" ? (
                <>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Unlimited contacts in CRM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Kanban pipeline view with drag & drop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Status tracking and follow-up reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Contact notes and activity timeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Team collaboration (1 member)</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">AI lead scoring (hot/warm/cold)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">AI email generator for outreach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">AI follow-up templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">AI partnership pitch generator</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Smart alerts for high-quality prospects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-sm">Auto-enrich missing contact data</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/settings" className="flex-1">
              <Button size="lg" className="w-full gap-2">
                {feature === "crm" ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                Upgrade to {feature === "crm" ? "ADVANCED" : "PRO"}
              </Button>
            </Link>
            <Link to="/pricing" className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                View All Plans
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your current plan: <Badge variant="secondary" className="ml-1">{userRole.toUpperCase()}</Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
