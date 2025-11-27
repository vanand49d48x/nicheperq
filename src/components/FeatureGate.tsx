import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap, Crown } from "lucide-react";
import { Link } from "react-router-dom";

type RoleAccess = {
  userId: string;
  role: string;
  has_crm_access: boolean;
  has_ai_access: boolean;
};

let cachedRoleAccess: RoleAccess | null = null;
let roleAccessPromise: Promise<RoleAccess | null> | null = null;

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

  const getCachedRoleAccess = async (): Promise<RoleAccess | null> => {
    if (cachedRoleAccess) {
      return cachedRoleAccess;
    }

    if (roleAccessPromise) return roleAccessPromise;

    roleAccessPromise = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role, has_crm_access, has_ai_access')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      if (!roleData) return null;

      cachedRoleAccess = {
        userId: user.id,
        role: roleData.role,
        has_crm_access: roleData.has_crm_access || false,
        has_ai_access: roleData.has_ai_access || false
      };

      return cachedRoleAccess;
    })();

    try {
      return await roleAccessPromise;
    } finally {
      roleAccessPromise = null;
    }
  };

  const applyAccess = (roleData: RoleAccess) => {
    setUserRole(roleData.role);

    if (roleData.role === 'admin') {
      setHasAccess(true);
      return;
    }

    if (feature === "crm") {
      setHasAccess(roleData.has_crm_access);
    } else if (feature === "ai") {
      setHasAccess(roleData.has_ai_access);
    }
  };

  const checkAccess = async () => {
    try {
      if (cachedRoleAccess) {
        applyAccess(cachedRoleAccess);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const roleData = await getCachedRoleAccess();

      if (!roleData) {
        setHasAccess(false);
        return;
      }

      applyAccess(roleData);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
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
                    <span className="text-muted-foreground">Advanced pipeline management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">Team collaboration features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">Unlimited contacts and notes</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">AI-powered automation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">Smart insights and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    <span className="text-muted-foreground">Workflow automation tools</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <h5 className="font-semibold mb-2">Current Plan: {userRole?.toUpperCase()}</h5>
              <p className="text-muted-foreground text-sm">Your current access level</p>
            </div>
            <div className="p-4 border rounded-lg bg-primary/5">
              <h5 className="font-semibold mb-2">Upgrade to Unlock</h5>
              <p className="text-muted-foreground text-sm">
                {feature === "crm"
                  ? "Access advanced CRM automation and team features"
                  : "Unlock AI-powered automations and insights"}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link to="/pricing">Upgrade Plan</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-w-[200px]">
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
