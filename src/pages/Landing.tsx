import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Users, Zap, CheckCircle2, MapPin, Star, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Search,
      title: "Smart Lead Discovery",
      description: "Find verified business leads in any niche with real-time data from public directories"
    },
    {
      icon: Users,
      title: "Built-in CRM",
      description: "Track contacts, manage follow-ups, and move leads through your sales pipeline"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get phone numbers, emails, and business details in seconds—no manual research"
    }
  ];

  const exampleLeads = [
    {
      name: "Martinez Law Group",
      category: "Probate Attorney",
      location: "Alpharetta, GA",
      rating: 4.8,
      reviews: 127,
      phone: "(770) 555-0123",
      email: "contact@martinezlaw.com"
    },
    {
      name: "Premier Property Management",
      category: "Property Manager",
      location: "Johns Creek, GA",
      rating: 4.6,
      reviews: 89,
      phone: "(678) 555-0456",
      email: "info@premierpm.com"
    },
    {
      name: "ProInspect Home Services",
      category: "Home Inspector",
      location: "Roswell, GA",
      rating: 4.9,
      reviews: 203,
      phone: "(404) 555-0789",
      email: "hello@proinspect.com"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">NichePerQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 glow-effect">
        <div className="container mx-auto max-w-6xl text-center">
          <Badge className="mb-4" variant="secondary">
            Private Beta Access
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Find Verified Referral Partners in Seconds
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover high-quality business leads in any niche—powered by real-time data. Built for professionals who value their time.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="shadow-glow">
                Start Free Trial <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            ✓ No credit card required ✓ 7-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Build Your Network</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-border bg-gradient-card shadow-sm">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Example Results */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">See What You'll Get</h2>
            <p className="text-muted-foreground">Real example results from a typical search</p>
            <div className="mt-6 inline-block bg-muted/50 rounded-lg px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Example search: <span className="font-semibold text-foreground">"probate attorney alpharetta ga"</span>
              </p>
              <p className="text-sm text-success font-semibold mt-1">
                Returns: 126 verified professionals with phone + email
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {exampleLeads.map((lead, idx) => (
              <Card key={idx} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{lead.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{lead.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{lead.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{lead.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({lead.reviews} reviews)</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lead Table Example */}
          <div className="mt-12">
            <Card className="border-border shadow-lg overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Lead Dashboard</CardTitle>
                    <CardDescription>Export to CSV, add tags, and track every contact</CardDescription>
                  </div>
                  <Badge variant="outline">137 leads found</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/20">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium">Business Name</th>
                        <th className="text-left p-4 text-sm font-medium">Location</th>
                        <th className="text-left p-4 text-sm font-medium">Contact</th>
                        <th className="text-left p-4 text-sm font-medium">Rating</th>
                        <th className="text-left p-4 text-sm font-medium">Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exampleLeads.map((lead, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-sm text-muted-foreground">{lead.category}</div>
                          </td>
                          <td className="p-4 text-sm">{lead.location}</td>
                          <td className="p-4">
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {lead.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {lead.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{lead.rating}</span>
                              <span className="text-sm text-muted-foreground">({lead.reviews})</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-xs">High Priority</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CRM Showcase */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Manage Leads Like a Pro</h2>
            <p className="text-muted-foreground">Built-in CRM to track every conversation and follow-up</p>
          </div>

          {/* Kanban Board Example */}
          <div className="mb-8">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle>Visual Pipeline</CardTitle>
                <CardDescription>See your entire sales process at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { stage: "New", count: 8, color: "bg-slate-500" },
                    { stage: "Contacted", count: 5, color: "bg-blue-500" },
                    { stage: "In Conversation", count: 3, color: "bg-purple-500" },
                    { stage: "Active Partner", count: 2, color: "bg-green-500" }
                  ].map((column, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{column.stage}</h3>
                        <Badge variant="outline" className="text-xs">{column.count}</Badge>
                      </div>
                      <div className="space-y-2">
                        <Card className="border-l-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderLeftColor: `var(--${column.color})` }}>
                          <CardContent className="p-3">
                            <p className="font-medium text-sm">Martinez Law Group</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              Alpharetta, GA
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>(770) 555-0123</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Card Example */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Martinez Law Group</CardTitle>
                    <CardDescription>Probate Attorney</CardDescription>
                  </div>
                  <Badge className="bg-blue-500 text-white">Connected</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>(770) 555-0123</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>contact@martinezlaw.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Alpharetta, GA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.8</span>
                    <span className="text-muted-foreground">(127 reviews)</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Follow-up</p>
                    <Badge variant="secondary">Tomorrow, 2:00 PM</Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
                      <p className="text-muted-foreground">• Called on Tuesday, very interested</p>
                      <p className="text-muted-foreground">• Sent partnership proposal</p>
                      <p className="text-muted-foreground">• Follow up on proposal response</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle>CRM Features</CardTitle>
                <CardDescription>Everything you need to close more deals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Contact Status Tracking</p>
                    <p className="text-xs text-muted-foreground">Move leads through your pipeline</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Follow-up Reminders</p>
                    <p className="text-xs text-muted-foreground">Never miss a scheduled call</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Detailed Notes</p>
                    <p className="text-xs text-muted-foreground">Track every conversation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Visual Pipeline</p>
                    <p className="text-xs text-muted-foreground">Kanban board for easy management</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Activity Timeline</p>
                    <p className="text-xs text-muted-foreground">See all interactions at a glance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-card rounded-lg shadow-lg p-8 md:p-12 text-center border border-border">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-lg italic text-muted-foreground mb-4">
              "NichePerQ transformed how I find referral partners. What used to take hours now takes minutes. The CRM features keep me organized and my pipeline is always full."
            </p>
            <p className="font-semibold">Sarah Mitchell</p>
            <p className="text-sm text-muted-foreground">Realtor, Atlanta Metro</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Referral Network?</h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of professionals finding quality leads every day
          </p>
          <Link to="/auth">
            <Button size="lg" className="shadow-glow">
              Start Free Trial <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-bold">NichePerQ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Find verified referral partners in seconds
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/pricing" className="block hover:text-foreground">Pricing</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/terms" className="block hover:text-foreground">Terms of Service</Link>
                <Link to="/privacy" className="block hover:text-foreground">Privacy Policy</Link>
                <Link to="/refund-policy" className="block hover:text-foreground">Refund Policy</Link>
                <Link to="/data-ethics" className="block hover:text-foreground">Data Ethics</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="mailto:support@nicheperq.com" className="block hover:text-foreground">Contact Us</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <p>© 2024 NichePerQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
