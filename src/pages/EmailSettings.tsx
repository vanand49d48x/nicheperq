import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, AlertCircle, Trash2, Send } from "lucide-react";
import { z } from "zod";

const smtpSchema = z.object({
  from_name: z.string().trim().min(1, "Name is required").max(100),
  from_email: z.string().trim().email("Invalid email address").max(255),
  smtp_host: z.string().trim().min(1, "SMTP host is required").max(255),
  smtp_port: z.number().int().min(1).max(65535),
  smtp_username: z.string().trim().min(1, "Username is required").max(255),
  smtp_password: z.string().min(1, "Password is required").max(255),
});

interface EmailAccount {
  id: string;
  provider: 'smtp';
  from_name: string;
  from_email: string;
  is_verified: boolean;
  created_at: string;
}

export default function EmailSettings() {
  const { toast } = useToast();
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingEmail, setTestingEmail] = useState(false);

  // SMTP form state
  const [smtpForm, setSmtpForm] = useState({
    from_name: "",
    from_email: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
  });
  const [smtpErrors, setSmtpErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmailAccount();
  }, []);

  const loadEmailAccount = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Only load smtp accounts
        if (data.provider === 'smtp') {
          setEmailAccount({
            id: data.id,
            provider: data.provider as 'smtp',
            from_name: data.from_name,
            from_email: data.from_email,
            is_verified: data.is_verified,
            created_at: data.created_at,
          });
        }
      }
    } catch (error) {
      console.error('Error loading email account:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const saveSMTP = async () => {
    try {
      // Validate form
      const result = smtpSchema.safeParse(smtpForm);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setSmtpErrors(errors);
        return;
      }
      setSmtpErrors({});

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to encrypt and save SMTP credentials
      const { data, error } = await supabase.functions.invoke('save-email-account', {
        body: {
          provider: 'smtp',
          from_name: smtpForm.from_name,
          from_email: smtpForm.from_email,
          smtp_host: smtpForm.smtp_host,
          smtp_port: smtpForm.smtp_port,
          smtp_username: smtpForm.smtp_username,
          smtp_password: smtpForm.smtp_password,
        }
      });

      if (error) throw error;

      toast({
        title: "SMTP Configured",
        description: "Your SMTP settings have been saved. Send a test email to verify.",
      });

      await loadEmailAccount();
    } catch (error: any) {
      console.error('Error saving SMTP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save SMTP settings",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async () => {
    try {
      setTestingEmail(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !emailAccount) return;

      const { error } = await supabase.functions.invoke('test-workspace-email', {
        body: { 
          email_account_id: emailAccount.id,
          test_recipient: user.email 
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Check your inbox at ${user.email}`,
      });

      // Mark as verified
      await supabase
        .from('email_accounts')
        .update({ is_verified: true, last_verified_at: new Date().toISOString() })
        .eq('id', emailAccount.id);

      await loadEmailAccount();
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email. Check your settings.",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const disconnectEmail = async () => {
    if (!emailAccount) return;

    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', emailAccount.id);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "Email account has been removed",
      });

      setEmailAccount(null);
      setSmtpForm({
        from_name: "",
        from_email: "",
        smtp_host: "",
        smtp_port: 587,
        smtp_username: "",
        smtp_password: "",
      });
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect email account",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-8">
          <p className="text-muted-foreground">Loading email settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure your email account to send workflow emails from your own address
          </p>
        </div>

        {emailAccount ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Connected Email Account
                  </CardTitle>
                  <CardDescription>
                    Workflow emails will be sent from this account
                  </CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnectEmail}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{emailAccount.from_name}</p>
                  <p className="text-sm text-muted-foreground">{emailAccount.from_email}</p>
                  <Badge variant="secondary" className="mt-2">
                    {emailAccount.provider.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {emailAccount.is_verified ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={sendTestEmail}
                disabled={testingEmail}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {testingEmail ? "Sending..." : "Send Test Email"}
              </Button>

              {!emailAccount.is_verified && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Send a test email to verify your email configuration is working correctly.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connect Email Account</CardTitle>
              <CardDescription>
                Choose how you want to send workflow emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Without a connected email account, automated workflow emails will not be sent. 
                  Connect an account to enable email automation.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your own SMTP server (works with Gmail, SendGrid, Mailgun, etc.)
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        value={smtpForm.from_name}
                        onChange={(e) => setSmtpForm({ ...smtpForm, from_name: e.target.value })}
                        placeholder="Your Name"
                      />
                      {smtpErrors.from_name && (
                        <p className="text-sm text-destructive mt-1">{smtpErrors.from_name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={smtpForm.from_email}
                        onChange={(e) => setSmtpForm({ ...smtpForm, from_email: e.target.value })}
                        placeholder="you@company.com"
                      />
                      {smtpErrors.from_email && (
                        <p className="text-sm text-destructive mt-1">{smtpErrors.from_email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        value={smtpForm.smtp_host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                      {smtpErrors.smtp_host && (
                        <p className="text-sm text-destructive mt-1">{smtpErrors.smtp_host}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={smtpForm.smtp_port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                      />
                      {smtpErrors.smtp_port && (
                        <p className="text-sm text-destructive mt-1">{smtpErrors.smtp_port}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="smtp_username">SMTP Username</Label>
                    <Input
                      id="smtp_username"
                      value={smtpForm.smtp_username}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtp_username: e.target.value })}
                      placeholder="your-email@gmail.com"
                    />
                    {smtpErrors.smtp_username && (
                      <p className="text-sm text-destructive mt-1">{smtpErrors.smtp_username}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="smtp_password">SMTP Password</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={smtpForm.smtp_password}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                      placeholder="Your app password or SMTP password"
                    />
                    {smtpErrors.smtp_password && (
                      <p className="text-sm text-destructive mt-1">{smtpErrors.smtp_password}</p>
                    )}
                  </div>

                  <Button onClick={saveSMTP} className="w-full">
                    Save SMTP Settings
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Using Gmail?</strong> Enable 2-factor authentication and use an{" "}
                      <a 
                        href="https://myaccount.google.com/apppasswords" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        App Password
                      </a>
                      {" "}instead of your regular password.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}