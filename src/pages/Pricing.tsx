import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "49",
      description: "Perfect for getting started",
      leads: "100",
      features: [
        "100 leads per month",
        "Phone & email included",
        "Basic CRM features",
        "Lead search & filtering",
        "Export to CSV",
        "Email support"
      ],
      cta: "Start Basic",
      popular: false
    },
    {
      name: "Standard",
      price: "99",
      description: "For growing professionals",
      leads: "250",
      features: [
        "250 leads per month",
        "Phone & email included",
        "Full CRM with pipeline",
        "Advanced filtering & sorting",
        "Follow-up reminders",
        "Contact notes",
        "Export to CSV",
        "Priority email support"
      ],
      cta: "Start Standard",
      popular: true
    },
    {
      name: "Advanced",
      price: "199",
      description: "For serious networkers",
      leads: "1,000",
      features: [
        "1,000 leads per month",
        "Phone & email included",
        "Complete CRM suite",
        "Unlimited saved searches",
        "Advanced analytics",
        "Team collaboration (coming soon)",
        "API access (coming soon)",
        "Priority support"
      ],
      cta: "Start Advanced",
      popular: false
    }
  ];

  const crmFeatures = [
    {
      title: "Contact Management",
      description: "Store every detail about your leads—phone, email, ratings, and more",
      icon: "📇"
    },
    {
      title: "Status Tracking",
      description: "Track where each lead is: New, Contacted, In Conversation, Active Partner",
      icon: "📊"
    },
    {
      title: "Notes & History",
      description: "Add notes to every contact: 'Called Tuesday', 'Sent proposal', 'Follow up next week'",
      icon: "📝"
    },
    {
      title: "Follow-up Reminders",
      description: "Set reminders: Tomorrow, 3 days, 1 week, or custom date",
      icon: "⏰"
    },
    {
      title: "Kanban Pipeline",
      description: "Visual pipeline with drag & drop: New → Contacted → Meeting → Active Partner",
      icon: "🎯"
    },
    {
      title: "Search & Filter",
      description: "Find any contact instantly by name, status, niche, or location",
      icon: "🔍"
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
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
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
            All plans include verified phone numbers, emails, and our powerful CRM. Start free for 7 days.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative border-border shadow-sm ${
                  plan.popular 
                    ? 'border-primary shadow-glow scale-105' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.leads} leads per month
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link to="/auth" className="w-full">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include a 7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* CRM Features */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful CRM Included</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don't just collect leads—manage relationships. Our built-in CRM helps you stay organized and close more deals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crmFeatures.map((feature, idx) => (
              <Card key={idx} className="border-border shadow-sm">
                <CardHeader>
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block border-border shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong className="text-foreground">CRM Features by Plan:</strong>
                </p>
                <div className="grid grid-cols-3 gap-8 text-sm">
                  <div>
                    <p className="font-semibold mb-2">Basic</p>
                    <p className="text-muted-foreground">Contact cards, status tracking, notes</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Standard</p>
                    <p className="text-muted-foreground">Full CRM + pipeline + reminders</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Advanced</p>
                    <p className="text-muted-foreground">Complete suite + analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Can You Do With NichePerQ?</h2>
            <p className="text-muted-foreground">Real examples from our users</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>🏡 Build Your Referral Network</CardTitle>
                <CardDescription>For Realtors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Search:</strong> "probate attorney + property manager + home inspector" in your area
                </p>
                <p className="text-sm">
                  <strong>Result:</strong> 200+ verified professionals with phone & email
                </p>
                <p className="text-sm">
                  <strong>CRM:</strong> Track conversations, set follow-ups, move to "Active Partner" when deals close
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "I built my entire referral network in 2 weeks instead of 6 months" - Maria K.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>💼 Find Strategic Partners</CardTitle>
                <CardDescription>For Business Owners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Search:</strong> "marketing agency + web designer + accountant" in target cities
                </p>
                <p className="text-sm">
                  <strong>Result:</strong> Instant access to potential partners and vendors
                </p>
                <p className="text-sm">
                  <strong>CRM:</strong> Organize by priority, add notes from calls, schedule follow-ups
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "Found 3 new strategic partners in our first month" - James T.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>📞 Outbound Sales Pipeline</CardTitle>
                <CardDescription>For Sales Teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Search:</strong> Target niches in multiple cities
                </p>
                <p className="text-sm">
                  <strong>Result:</strong> Fresh leads daily with accurate contact info
                </p>
                <p className="text-sm">
                  <strong>CRM:</strong> Full pipeline view from "New" to "Closed Deal"
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "Our outbound team increased productivity by 3x" - David R.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>🎯 Market Research</CardTitle>
                <CardDescription>For Agencies & Consultants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  <strong>Search:</strong> Analyze competitor landscapes in any market
                </p>
                <p className="text-sm">
                  <strong>Result:</strong> Complete directory with ratings, reviews, locations
                </p>
                <p className="text-sm">
                  <strong>CRM:</strong> Tag and categorize for easy reporting
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "We use it for client market analysis reports" - Sarah P.
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
                <CardTitle className="text-lg">How is data verified?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  All data comes from public business directories and is updated daily. We verify phone numbers and emails are active before displaying them.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! Cancel anytime from your settings. No long-term contracts or hidden fees. We also offer a 7-day money-back guarantee.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">What if I need more leads?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You can upgrade your plan anytime. Unused leads from your current month don't carry over, but you get your new limit immediately upon upgrade.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Is the CRM included in all plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Yes! Basic CRM features are included in all plans. Standard and Advanced plans unlock the full pipeline view, reminders, and advanced features.
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
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join hundreds of professionals building their networks with NichePerQ
              </p>
              <Link to="/auth">
                <Button size="lg" className="shadow-md">
                  Start Your Free Trial <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                7-day free trial • No credit card required • Cancel anytime
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
