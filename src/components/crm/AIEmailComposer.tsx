import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Send, Clock, RefreshCw } from "lucide-react";

interface AIEmailComposerProps {
  leadId: string;
  leadName: string;
  onEmailSent?: () => void;
  onClose?: () => void;
}

export const AIEmailComposer = ({ leadId, leadName, onEmailSent, onClose }: AIEmailComposerProps) => {
  const [emailType, setEmailType] = useState<'initial' | 'follow_up' | 'meeting_request'>('initial');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'direct'>('professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const generateEmail = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-draft-email', {
        body: { lead_id: leadId, email_type: emailType, tone }
      });

      if (error) throw error;

      setSubject(data.subject);
      setBody(data.body);
      setDraftId(data.id);

      toast({
        title: "Email drafted!",
        description: "AI has generated a personalized email for you",
      });
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "Failed to generate email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!draftId) {
      toast({
        title: "No draft",
        description: "Please generate an email first",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { draft_id: draftId, send_now: true }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Your email has been sent successfully",
      });

      onEmailSent?.();
      onClose?.();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const approveForLater = async () => {
    if (!draftId) return;

    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { draft_id: draftId, send_now: false }
      });

      if (error) throw error;

      toast({
        title: "Draft approved",
        description: "Email has been saved for later",
      });

      onClose?.();
    } catch (error) {
      console.error('Error approving email:', error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Email Composer</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Sending to: <span className="font-medium">{leadName}</span>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email Type</Label>
          <Select value={emailType} onValueChange={(value: any) => setEmailType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial Outreach</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="meeting_request">Meeting Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={(value: any) => setTone(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        onClick={generateEmail} 
        disabled={isGenerating}
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </>
        )}
      </Button>

      {(subject || body) && (
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Email content..."
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={sendEmail} disabled={isSending} className="flex-1 gap-2">
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Now
                </>
              )}
            </Button>
            <Button variant="outline" onClick={approveForLater} className="gap-2">
              <Clock className="h-4 w-4" />
              Save for Later
            </Button>
            <Button variant="ghost" onClick={generateEmail} disabled={isGenerating}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};