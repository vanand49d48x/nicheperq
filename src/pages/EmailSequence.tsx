import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const EmailSequence = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const emails = [
    {
      day: "Day 1",
      subject: "Quick question about [Their Niche] in [City]",
      body: `Hi [First Name],

I came across your [business type] listing and was impressed by your [specific detail - reviews, years in business, etc.].

I work with [your profession/company] and we often get clients looking for [what they offer]. I'd love to explore a referral partnership where we can send qualified leads to each other.

Would you be open to a quick 10-minute call this week?

Best,
[Your Name]
[Your Title]
[Your Phone]
[Your Website]

P.S. No pressure—just thought there might be a mutual benefit here.`,
      notes: "Personalized opener. Establishes credibility. Clear ask. Low commitment."
    },
    {
      day: "Day 4",
      subject: "Re: Quick question about [Their Niche]",
      body: `Hi [First Name],

Just wanted to follow up on my email from earlier this week.

I'm reaching out because I genuinely believe there's an opportunity for us to help each other grow our businesses through strategic referrals.

Here's what I had in mind:
• I send you qualified leads looking for [their service]
• You send me clients who need [your service]
• We both grow without spending on ads

If this sounds interesting, let me know a good time to chat. Even 10 minutes would work.

Thanks,
[Your Name]
[Your Phone]

P.S. I'm happy to send you a lead first as a goodwill gesture.`,
      notes: "Value proposition. Specific benefits. Social proof element. First-give mindset."
    },
    {
      day: "Day 8",
      subject: "Thought you might appreciate this [Their Name]",
      body: `Hi [First Name],

I know you're busy, so I'll keep this brief.

I actually just came across a potential client who needs [their service] in [area]. Before I refer them elsewhere, I wanted to reach out one more time to see if you'd be interested in a referral partnership.

No strings attached—I'm happy to send this lead your way even if we don't end up working together.

Interested?

[Your Name]
[Your Phone]`,
      notes: "Immediate value. Scarcity (potential lost opportunity). Ultra-brief."
    },
    {
      day: "Day 15",
      subject: "Final follow-up: [City] referral network",
      body: `Hi [First Name],

This will be my last email—I don't want to clutter your inbox.

I've been building a network of [industry] professionals in [City] who refer business to each other, and I thought you'd be a great fit.

If you're not interested, no worries at all. But if you ever change your mind, my door is always open.

Wishing you continued success with [Business Name].

Best,
[Your Name]
[Your Email]
[Your Phone]

P.S. If you know anyone else who might be interested in a referral partnership, feel free to pass my info along.`,
      notes: "Final touch. No pressure. Leaves door open. Social expansion (ask for referrals)."
    }
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">4-Step Email Outreach Sequence</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Proven B2B cold email templates for building referral partnerships
          </p>
        </div>

        <Card className="p-6 mb-8 bg-gradient-card border-primary/20">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Best Practices for Success
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p>• <strong>Personalize:</strong> Mention specific details about their business</p>
              <p>• <strong>Keep it short:</strong> 3-5 sentences max per email</p>
              <p>• <strong>Clear CTA:</strong> One specific ask per email</p>
              <p>• <strong>Send weekdays:</strong> Tuesday-Thursday 10am-2pm performs best</p>
            </div>
            <div className="space-y-2">
              <p>• <strong>Include opt-out:</strong> "Reply 'STOP' to unsubscribe" at bottom</p>
              <p>• <strong>Use real email:</strong> No noreply@ addresses</p>
              <p>• <strong>Track opens:</strong> Adjust timing based on engagement</p>
              <p>• <strong>Honor requests:</strong> Remove anyone who asks immediately</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {emails.map((email, index) => (
            <Card key={index} className="p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm">
                    {email.day}
                  </Badge>
                  <h3 className="text-xl font-semibold">Email #{index + 1}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${email.subject}\n\n${email.body}`, `Email ${index + 1}`)}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject Line:</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <p className="font-medium">{email.subject}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(email.subject, "Subject line")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email Body:</label>
                  <div className="mt-1 p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap relative group">
                    {email.body}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(email.body, "Email body")}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <strong className="text-primary">Why this works:</strong> {email.notes}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-gradient-subtle">
          <h2 className="text-xl font-semibold mb-3">⚖️ Legal Compliance Reminders</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ <strong>CAN-SPAM:</strong> Include your physical address and clear unsubscribe option</li>
            <li>✅ <strong>Accurate Headers:</strong> Use your real name and business email</li>
            <li>✅ <strong>Honest Subject Lines:</strong> No deceptive or misleading subjects</li>
            <li>✅ <strong>Honor Opt-Outs:</strong> Process unsubscribe requests within 10 business days</li>
            <li>✅ <strong>B2B Only:</strong> These templates are for business contacts, not consumers</li>
          </ul>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Need help with your outreach? Contact us at <strong>support@nicheperq.com</strong>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmailSequence;
