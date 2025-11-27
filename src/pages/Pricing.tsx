import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight, X, Lock, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Pricing = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const plans = [
    {
      name: "FREE",
      subtitle: "Starter Plan",
      price: "0",
      tagline: "No credit card required",
      description: "Try the value, see the data quality",
      features: [
        "5 niche searches per month",
        "10 lead previews per search",
        "View basic business info (name, category, rating)",
      ],
      limitations: [
        "No email/phone access",
        "No CSV export",
        "No CRM access",
        "No AI features"
      ],
      cta: "Start Free",
      popular: false,
      free: true
    },
    {
      name: "STANDARD",
      subtitle: "Niche Finder",
      price: "29",
      tagline: "Simple, lightweight plan → easy entry",
      description: "For users who only want leads",
      features: [
        "Unlimited niche searches",
        "Full lead details (phone + email)",
        "Filter by rating, reviews, recency",
        "Export to CSV",
        "Save searches",
        "Map view",
        "500 leads/month included"
      ],
      limitations: [
        "No CRM features",
        "No AI features"
      ],
      cta: "Get Standard",
      popular: false
    },
    {
      name: "ADVANCED",
      subtitle: "Niche + CRM",
      price: "79",
      tagline: "Everything in Standard +",
      description: "Great for Realtors, Medspas, Contractors, Attorneys",
      features: [
        "Everything in Standard",
        "Unlimited contacts in CRM",
        "Status stages (New, Contacted, Meeting, Partner)",
        "Notes per contact",
        "Follow-up reminders",
        "Pipeline (Kanban view)",
        "Activity timeline",
        "Daily/weekly reminders",
        "Collaboration (1 team member)",
        "2,500 leads/month"
      ],
      limitations: [
        "No AI features"
      ],
      cta: "Get Advanced",
      popular: true,
      badge: "MOST POPULAR"
    },
    {
      name: "PRO",
      subtitle: "Niche + CRM + AI",
      price: "149",
      tagline: "Everything in Advanced +",
      description: "Your premium flagship",
      features: [
        "Everything in Advanced",
        "AI lead scoring (hot/warm/cold)",
        "AI email generator for outreach",
        "AI follow-up templates",
        "AI partnership pitch generator",
        "AI niche analysis & suggestions",
        "Smart Alerts: New high-quality partner detected",
        "Auto-enrich missing data (website → email)",
        "5,000 leads/month"
      ],
      limitations: [],
      cta: "Get Pro",
      popular: false,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground">NichePerQ</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
                <Button onClick={() => navigate('/settings')}>
                  View Plans
                </Button>
              </>
            ) : (
              <>
                <Link to="/">
                  <Button variant="ghost">Home</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4" variant="secondary">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From free trials to enterprise AI—find the perfect fit for your niche outreach needs
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative border-border shadow-sm hover:shadow-md transition-all ${
                  plan.popular 
                    ? 'border-primary shadow-glow scale-105' 
                    : ''
                } ${plan.premium ? 'bg-gradient-card' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-xs px-3 py-1">{plan.badge}</Badge>
                  </div>
                )}
                <CardHeader className="space-y-3">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">{plan.subtitle}</p>
                  </div>
                  <CardDescription className="text-xs italic">{plan.tagline}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground pt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-3">INCLUDES:</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">NOT INCLUDED:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, lIdx) => (
                          <li key={lIdx} className="flex items-start gap-2">
                            <X className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link to="/auth" className="w-full">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : plan.free ? "outline" : "secondary"}
                    >
                      {plan.cta}
                      {plan.premium && <Zap className="ml-2 h-4 w-4" />}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What's Included in Each Plan?</h2>
            <p className="text-muted-foreground">Compare features side-by-side</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">FREE</th>
                  <th className="text-center p-4 font-semibold">STANDARD</th>
                  <th className="text-center p-4 font-semibold bg-primary/5">ADVANCED</th>
                  <th className="text-center p-4 font-semibold">PRO</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="p-4 text-sm">Monthly Leads</td>
                  <td className="text-center p-4 text-sm">50 previews</td>
                  <td className="text-center p-4 text-sm">500</td>
                  <td className="text-center p-4 text-sm bg-primary/5">2,500</td>
                  <td className="text-center p-4 text-sm">5,000</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 text-sm">Full Contact Info</td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-success mx-auto" /></td>
                  <td className="text-center p-4 bg-primary/5"><Check className="h-4 w-4 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 text-sm">CRM Features</td>
                  <td className="text-center p-4"><Lock className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Lock className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4 bg-primary/5"><Check className="h-4 w-4 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 text-sm">AI Features</td>
                  <td className="text-center p-4"><Lock className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Lock className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4 bg-primary/5"><Lock className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-success mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For Your Industry</h2>
            <p className="text-muted-foreground">See how professionals are using NichePerQ</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>🏡 Realtors → ADVANCED</CardTitle>
                <CardDescription>Build Your Referral Network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Use Case:</strong> Find probate attorneys, property managers, home inspectors
                </p>
                <p className="text-sm">
                  <strong>Why ADVANCED:</strong> Full CRM to track relationships, follow-up reminders, pipeline to manage partnerships
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "Built my entire network in 2 weeks with the CRM" - Maria K.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>💼 B2B Sales Teams → PRO</CardTitle>
                <CardDescription>AI-Powered Outreach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Use Case:</strong> Target specific niches, auto-generate outreach emails
                </p>
                <p className="text-sm">
                  <strong>Why PRO:</strong> AI email generator, lead scoring, smart alerts for hot prospects
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "AI drafts save 10+ hours/week" - David R.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>🎨 Freelancers → STANDARD</CardTitle>
                <CardDescription>Just Need Leads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Use Case:</strong> Find potential clients, export to spreadsheet
                </p>
                <p className="text-sm">
                  <strong>Why STANDARD:</strong> Unlimited searches, full contact info, CSV export. No CRM complexity.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "Simple and affordable for my side hustle" - Alex P.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>🔍 Market Research → FREE Trial</CardTitle>
                <CardDescription>Test Before You Buy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Use Case:</strong> Explore data quality, see what's available
                </p>
                <p className="text-sm">
                  <strong>Why FREE:</strong> 5 searches to verify data accuracy before committing
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "Tried it free, upgraded same day" - Sarah L.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">What's included in the FREE plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You get 5 searches per month with 10 lead previews each (50 total). You'll see basic info like business name, category, and rating—but phone/email are masked. Perfect for testing data quality!
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">What's the difference between STANDARD and ADVANCED?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  STANDARD is for users who just want leads (500/month) with full contact details. ADVANCED adds our full CRM suite (2,500 leads/month) with pipeline management, follow-up reminders, notes, and collaboration.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Is PRO worth it?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you're doing high-volume outreach, absolutely. The AI email generator alone saves 10+ hours/week. Plus you get lead scoring, smart alerts, and 5,000 leads/month—double the ADVANCED limit.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans are month-to-month. Cancel anytime from your settings. No contracts, no cancellation fees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-primary shadow-glow bg-gradient-card">
            <CardContent className="pt-8 pb-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Start Finding Your Niche Today</h2>
              <p className="text-muted-foreground mb-6">
                Join professionals building strategic networks with NichePerQ
              </p>
              <Link to="/auth">
                <Button size="lg" className="shadow-md">
                  Start Free <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required • Upgrade anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-background">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold">NichePerQ</span>
          </div>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
            <Link to="/data-ethics" className="hover:text-foreground">Data Ethics</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 NichePerQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
