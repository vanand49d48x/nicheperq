import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type SubscriptionRole = 'free' | 'basic' | 'standard' | 'advanced' | 'pro' | 'admin';

const planDetails = {
  basic: {
    name: "Basic Plan",
    leads: "100 leads/month",
    benefits: [
      "100 leads per month",
      "Save search queries",
      "Export to CSV",
      "Email support"
    ]
  },
  standard: {
    name: "Standard Plan",
    leads: "250 leads/month",
    benefits: [
      "250 leads per month",
      "Save search queries",
      "Export to CSV",
      "Priority email support",
      "Advanced filters"
    ]
  },
  advanced: {
    name: "Advanced Plan",
    leads: "1000 leads/month",
    benefits: [
      "1000 leads per month",
      "Save unlimited searches",
      "Export to CSV",
      "Priority support",
      "Advanced filters",
      "API access",
      "Custom integrations"
    ]
  }
};

export default function Success() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<SubscriptionRole>('free');

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      if (data?.role) {
        setRole(data.role);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to verify subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plan = planDetails[role as keyof typeof planDetails];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to {plan?.name || 'Your Plan'}!
            </CardTitle>
            <CardDescription className="text-lg">
              Your subscription has been successfully activated
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {plan && (
            <div className="space-y-6">
              <div className="bg-accent/20 rounded-lg p-6 border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Your Benefits</h3>
                </div>
                <ul className="space-y-3">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground text-center">
                  You can manage, upgrade, downgrade, or cancel your subscription anytime
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => navigate('/')}
              className="flex-1"
              size="lg"
            >
              Start Finding Leads
            </Button>
            <Button
              onClick={handleManageSubscription}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
