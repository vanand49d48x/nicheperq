import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, Crown } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().trim().max(100).optional(),
});

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [currentRole, setCurrentRole] = useState<string>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  useEffect(() => {
    loadProfile();
    checkSubscription();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setCompany(profile.company || "");
    }

    // Get user role
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
    if (roleData) {
      setCurrentRole(roleData);
    }
  };

  const checkSubscription = async () => {
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data) {
        setCurrentRole(data.role || 'free');
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    try {
      toast.loading("Redirecting to checkout...");
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: priceId }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.dismiss();
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error("Failed to start checkout process");
    }
  };

  const handleManageSubscription = async () => {
    try {
      toast.loading("Opening subscription portal...");
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.dismiss();
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error("Failed to open subscription portal");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      profileSchema.parse({ full_name: fullName, company });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company: company || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 px-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your Company"
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Choose the plan that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Free Plan */}
                  <div className={`relative p-6 rounded-lg border-2 ${currentRole === 'free' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {currentRole === 'free' && (
                      <Badge className="absolute top-4 right-4">Current Plan</Badge>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold">FREE</h3>
                        <p className="text-xs text-muted-foreground">Starter Plan</p>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">$0</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">5 searches/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">10 previews per search</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Basic info only</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Standard Plan - $29 */}
                  <div className={`relative p-6 rounded-lg border-2 ${currentRole === 'standard' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {currentRole === 'standard' && (
                      <Badge className="absolute top-4 right-4">Current Plan</Badge>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold">STANDARD</h3>
                        <p className="text-xs text-muted-foreground">Niche Finder</p>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">$29</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">500 leads/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Full contact details</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Unlimited searches</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">CSV export</span>
                        </li>
                      </ul>
                      {currentRole === 'standard' ? (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={handleManageSubscription}
                        >
                          Manage
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleUpgrade('price_1SWKeGCqpWv7ka0Ikv8N0Mlk')}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Advanced Plan - $79 */}
                  <div className={`relative p-6 rounded-lg border-2 ${currentRole === 'advanced' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {currentRole === 'advanced' && (
                      <Badge className="absolute top-4 right-4">Current Plan</Badge>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">ADVANCED</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">Niche + CRM</p>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">$79</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">2,500 leads/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Full CRM suite</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Kanban pipeline</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Follow-up reminders</span>
                        </li>
                      </ul>
                      {currentRole === 'advanced' ? (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={handleManageSubscription}
                        >
                          Manage
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleUpgrade('price_1SWKeqCqpWv7ka0I462tpm98')}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Pro Plan - $149 */}
                  <div className={`relative p-6 rounded-lg border-2 ${currentRole === 'pro' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    {currentRole === 'pro' && (
                      <Badge className="absolute top-4 right-4">Current Plan</Badge>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">PRO</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">Niche + CRM + AI</p>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">$149</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">5,000 leads/month</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Everything in Advanced</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">AI email generator</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">AI lead scoring</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">Smart AI alerts</span>
                        </li>
                      </ul>
                      {currentRole === 'pro' ? (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={handleManageSubscription}
                        >
                          Manage
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleUpgrade('price_1SWKfGCqpWv7ka0I6YFNjEkz')}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {subscriptionEnd && (currentRole === 'basic' || currentRole === 'standard' || currentRole === 'advanced' || currentRole === 'pro') && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Your subscription renews on {new Date(subscriptionEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkSubscription}
                  disabled={checkingSubscription}
                >
                  {checkingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Refresh Subscription Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
