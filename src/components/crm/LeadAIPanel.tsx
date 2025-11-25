import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, Phone, TrendingUp, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface LeadAIPanelProps {
  lead: any;
  onRefresh?: () => void;
}

export const LeadAIPanel = ({ lead, onRefresh }: LeadAIPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyzeLead = async () => {
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke('ai-analyze-lead', {
        body: { lead_id: lead.id }
      });

      if (error) throw error;

      toast.success('AI analysis complete!');
      // Refresh only this card's data locally, not the entire board
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error analyzing lead:', error);
      toast.error('Failed to analyze lead');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAIAction = async (type: string) => {
    setLoading(true);
    setActionType(type);
    setAiResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-lead-assistant', {
        body: { 
          lead_id: lead.id, 
          action_type: type,
          additional_context: additionalContext
        }
      });

      if (error) throw error;

      setAiResponse(data.response);
      setAdditionalContext("");
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-yellow-500';
      case 'cold': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Lead Intelligence Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Lead Intelligence
          </CardTitle>
          <CardDescription>
            AI-powered insights about {lead.business_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!lead.ai_quality_score ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                This lead hasn't been analyzed yet. Run AI analysis to get insights.
              </p>
              <Button
                onClick={handleAnalyzeLead}
                disabled={analyzing}
                className="gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Lead Now
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(lead.ai_quality_score)}`}>
                    {lead.ai_quality_score || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Quality Score</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(lead.ai_intent_score)}`}>
                    {lead.ai_intent_score || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Intent Score</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(lead.closing_probability)}`}>
                    {lead.closing_probability || '—'}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Close Probability</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {lead.sentiment && (
                      <Badge variant="outline" className={getSentimentColor(lead.sentiment)}>
                        {lead.sentiment}
                      </Badge>
                    )}
                    {!lead.sentiment && '—'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Sentiment</div>
                </div>
              </div>

              {lead.recommended_action && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Recommended Action:</p>
                  <p className="text-sm text-muted-foreground">{lead.recommended_action}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyzeLead}
                  disabled={analyzing}
                  className="gap-2"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Re-analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Re-analyze
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Assistant Actions</CardTitle>
          <CardDescription>
            Get AI-powered help for this specific lead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAIAction('suggest_email')}
              disabled={loading}
            >
              <Mail className="h-4 w-4" />
              Draft Email
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAIAction('suggest_call_script')}
              disabled={loading}
            >
              <Phone className="h-4 w-4" />
              Call Script
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAIAction('predict_outcome')}
              disabled={loading}
            >
              <TrendingUp className="h-4 w-4" />
              Predict Outcome
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAIAction('summarize')}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4" />
              Summarize Lead
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Context (optional):</label>
            <Textarea
              placeholder="Add any specific instructions or context for the AI..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Response */}
      {(loading || aiResponse) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">AI Response</CardTitle>
              {aiResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">
                  {actionType === 'suggest_email' && 'Drafting personalized email...'}
                  {actionType === 'suggest_call_script' && 'Creating call script...'}
                  {actionType === 'predict_outcome' && 'Analyzing lead data...'}
                  {actionType === 'summarize' && 'Summarizing lead journey...'}
                  {!actionType && 'Processing...'}
                </span>
              </div>
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {!lead.ai_quality_score && (
        <Card className="border-yellow-500/50 bg-yellow-50/10">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 Tip: Run AI Analysis on this lead first to get better personalized suggestions!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
