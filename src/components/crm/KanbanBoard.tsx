import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Globe, Star, ChevronRight, Sparkles, TrendingUp, TrendingDown, Flame, Mail, PhoneCall, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContactCard } from "./ContactCard";
import { BatchActionsBar } from "./BatchActionsBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { applyAutoTags } from "@/lib/autoTagging";

interface KanbanBoardProps {
  leads: any[];
  onStatusChange: (leadId: string, status: string) => void;
  onRefresh: () => void;
  onLeadUpdate?: (leadId: string, updates: any) => void;
  statusFilter?: string | null;
  onClearFilter?: () => void;
}

const columns = [
  { id: "new", label: "New", color: "bg-slate-100 dark:bg-slate-900" },
  { id: "attempted", label: "Contacted", color: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "connected", label: "Connected", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "in_conversation", label: "Meeting Scheduled", color: "bg-purple-50 dark:bg-purple-950" },
  { id: "active_partner", label: "Active Partner", color: "bg-green-50 dark:bg-green-950" },
];

export const KanbanBoard = ({ leads, onStatusChange, onRefresh, onLeadUpdate, statusFilter, onClearFilter }: KanbanBoardProps) => {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [analyzingLeads, setAnalyzingLeads] = useState<Set<string>>(new Set());
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const [pendingAnalysisCount, setPendingAnalysisCount] = useState(0);

  const getLeadsForColumn = (columnId: string) => {
    return leads.filter(lead => lead.contact_status === columnId);
  };

  // Filter columns based on statusFilter
  const visibleColumns = statusFilter 
    ? columns.filter(col => col.id === statusFilter)
    : columns;

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'hot': return 'border-l-4 border-l-red-500';
      case 'warm': return 'border-l-4 border-l-yellow-500';
      case 'cold': return 'border-l-4 border-l-blue-500';
      default: return '';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'hot': return <Flame className="h-3 w-3 text-red-500" />;
      case 'warm': return <TrendingUp className="h-3 w-3 text-yellow-500" />;
      case 'cold': return <TrendingDown className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const analyzeLeadWithAI = async (leadId: string) => {
    setAnalyzingLeads(prev => new Set(prev).add(leadId));
    
    try {
      console.log('Starting AI analysis for lead:', leadId);
      const { data, error } = await supabase.functions.invoke('ai-analyze-lead', {
        body: { lead_id: leadId }
      });

      console.log('AI analysis response:', { data, error });

      if (error) {
        console.error('AI analysis error:', error);
        throw error;
      }

      // Fetch updated lead to get AI scores
      const { data: updatedLead, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (!fetchError && updatedLead && onLeadUpdate) {
        // Update just this one lead in parent state without full refresh
        onLeadUpdate(leadId, updatedLead);
      }

      // Auto-tag after analysis
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await applyAutoTags(supabase, leadId, user.id);
      }

      toast.success('AI analysis complete! Scores updated.');
    } catch (error) {
      console.error('Error analyzing lead:', error);
      toast.error(`Failed to analyze lead: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzingLeads(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  const analyzeBatchLeads = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select leads to analyze');
      return;
    }

    const leadsToAnalyze = Array.from(selectedLeads);
    let successCount = 0;
    let failCount = 0;

    toast.info(`Analyzing ${leadsToAnalyze.length} leads...`);

    for (const leadId of leadsToAnalyze) {
      try {
        setAnalyzingLeads(prev => new Set(prev).add(leadId));
        
        const { error } = await supabase.functions.invoke('ai-analyze-lead', {
          body: { lead_id: leadId }
        });

        if (error) throw error;

        // Auto-tag after analysis
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await applyAutoTags(supabase, leadId, user.id);
        }

        successCount++;
      } catch (error) {
        console.error(`Error analyzing lead ${leadId}:`, error);
        failCount++;
      } finally {
        setAnalyzingLeads(prev => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
      }
    }

    onRefresh();
    setSelectedLeads(new Set());
    setBatchMode(false);

    if (failCount === 0) {
      toast.success(`Successfully analyzed ${successCount} leads!`);
    } else {
      toast.warning(`Analyzed ${successCount} leads, ${failCount} failed`);
    }
  };

  const requestAnalyzeAllNewLeads = () => {
    const newLeads = leads.filter(lead => !lead.ai_quality_score);
    
    if (newLeads.length === 0) {
      toast.info('All leads have already been analyzed!');
      return;
    }

    setPendingAnalysisCount(newLeads.length);
    setShowAnalyzeDialog(true);
  };

  const analyzeAllNewLeads = async () => {
    const newLeads = leads.filter(lead => !lead.ai_quality_score);
    setShowAnalyzeDialog(false);

    let successCount = 0;
    let failCount = 0;

    toast.info(`Starting analysis of ${newLeads.length} leads...`);

    for (const lead of newLeads) {
      try {
        setAnalyzingLeads(prev => new Set(prev).add(lead.id));
        
        const { error } = await supabase.functions.invoke('ai-analyze-lead', {
          body: { lead_id: lead.id }
        });

        if (error) throw error;

        // Auto-tag after analysis
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await applyAutoTags(supabase, lead.id, user.id);
        }

        successCount++;
        
        // Show progress
        if (successCount % 5 === 0) {
          toast.info(`Analyzed ${successCount}/${newLeads.length} leads...`);
        }
      } catch (error) {
        console.error(`Error analyzing lead ${lead.id}:`, error);
        failCount++;
      } finally {
        setAnalyzingLeads(prev => {
          const next = new Set(prev);
          next.delete(lead.id);
          return next;
        });
      }
    }

    onRefresh();

    if (failCount === 0) {
      toast.success(`Successfully analyzed all ${successCount} leads!`);
    } else {
      toast.warning(`Analyzed ${successCount} leads, ${failCount} failed`);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  };

  const handleQuickEmail = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    } else {
      toast.error('No email available for this lead');
    }
  };

  const handleQuickCall = (lead: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    } else {
      toast.error('No phone available for this lead');
    }
  };

  const handleAutoTag = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await applyAutoTags(supabase, leadId, user.id);
        toast.success('Auto-tags applied!');
        onRefresh();
      }
    } catch (error) {
      console.error('Error auto-tagging:', error);
      toast.error('Failed to apply auto-tags');
    }
  };

  return (
    <>
      {statusFilter && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm">
              Filtered: {columns.find(c => c.id === statusFilter)?.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Showing only {columns.find(c => c.id === statusFilter)?.label} contacts
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClearFilter}
            className="text-xs"
          >
            Clear Filter
          </Button>
        </div>
      )}
      
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedLeads(new Set());
            }}
            className="gap-2"
          >
            <Checkbox checked={batchMode} />
            Batch Mode {selectedLeads.size > 0 && `(${selectedLeads.size})`}
          </Button>

          {batchMode && selectedLeads.size > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={analyzeBatchLeads}
              className="gap-2"
              disabled={analyzingLeads.size > 0}
            >
              <Sparkles className="h-4 w-4" />
              Analyze Selected ({selectedLeads.size})
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={requestAnalyzeAllNewLeads}
          className="gap-2"
          disabled={analyzingLeads.size > 0}
        >
          <Sparkles className="h-4 w-4" />
          Auto-Analyze All New
        </Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {visibleColumns.map((column) => {
            const columnLeads = getLeadsForColumn(column.id);
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className={cn("rounded-lg p-4 min-h-[600px]", column.color)}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{column.label}</h3>
                    <Badge variant="secondary">{columnLeads.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {columnLeads.map((lead) => (
                      <TooltipProvider key={lead.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Card
                              className={cn(
                                "p-3 cursor-pointer hover:shadow-md transition-shadow relative",
                                getSentimentColor(lead.sentiment),
                                selectedLeads.has(lead.id) && "ring-2 ring-primary"
                              )}
                              onClick={() => !batchMode && setSelectedLead(lead)}
                            >
                              {batchMode && (
                                <div className="absolute top-2 left-2 z-10">
                                  <Checkbox
                                    checked={selectedLeads.has(lead.id)}
                                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}

                              <div className={cn("flex items-start gap-2 mb-2", batchMode && "ml-6")}>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium line-clamp-1 text-sm">
                                    {lead.business_name}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {getSentimentIcon(lead.sentiment)}
                                  {lead.ai_quality_score !== null && (
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", getScoreColor(lead.ai_quality_score))}
                                    >
                                      {lead.ai_quality_score}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-1 text-xs text-muted-foreground mb-2">
                                {lead.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span className="truncate">{lead.phone}</span>
                                  </div>
                                )}
                                {lead.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{lead.rating} ({lead.review_count || 0})</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1 items-center mb-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {lead.niche}
                                </Badge>
                                {lead.closing_probability !== null && (
                                  <Badge variant="secondary" className="text-xs">
                                    {lead.closing_probability}%
                                  </Badge>
                                )}
                              </div>

                              {/* Auto Tags */}
                              {lead.tags && lead.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap mb-2">
                                  {lead.tags.slice(0, 3).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {lead.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{lead.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Quick Actions */}
                              {!batchMode && (
                                <div className="flex gap-1 mb-2">
                                  {lead.email && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => handleQuickEmail(lead, e)}
                                      title="Send email"
                                    >
                                      <Mail className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {lead.phone && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => handleQuickCall(lead, e)}
                                      title="Call"
                                    >
                                      <PhoneCall className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {(!lead.tags || lead.tags.length === 0) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={(e) => handleAutoTag(lead.id, e)}
                                      title="Auto-tag"
                                    >
                                      <Tag className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}

                              {!lead.ai_quality_score && !batchMode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mb-2 gap-1 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    analyzeLeadWithAI(lead.id);
                                  }}
                                  disabled={analyzingLeads.has(lead.id)}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {analyzingLeads.has(lead.id) ? 'Analyzing...' : 'AI Analyze'}
                                </Button>
                              )}

                              {column.id !== "active_partner" && !batchMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full gap-1 h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextColumn = columns[columns.findIndex(c => c.id === column.id) + 1];
                                    if (nextColumn) {
                                      onStatusChange(lead.id, nextColumn.id);
                                    }
                                  }}
                                >
                                  Move to {columns[columns.findIndex(c => c.id === column.id) + 1]?.label}
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              )}
                            </Card>
                          </TooltipTrigger>
                          {lead.recommended_action && !batchMode && (
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold text-xs">Recommended Action:</p>
                                <p className="text-xs">{lead.recommended_action}</p>
                                {lead.sentiment && (
                                  <p className="text-xs text-muted-foreground capitalize">
                                    Status: {lead.sentiment}
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}

                    {columnLeads.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No contacts
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BatchActionsBar 
        selectedLeads={selectedLeads}
        onClearSelection={() => setSelectedLeads(new Set())}
        onRefresh={onRefresh}
      />

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <ContactCard
              lead={selectedLead}
              onStatusChange={(status) => {
                onStatusChange(selectedLead.id, status);
                setSelectedLead(null);
              }}
              onRefresh={() => {
                onRefresh();
                setSelectedLead(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showAnalyzeDialog} onOpenChange={setShowAnalyzeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyze Leads with AI</AlertDialogTitle>
            <AlertDialogDescription>
              This will analyze {pendingAnalysisCount} leads using AI. This may take a few minutes.
              <br />
              <br />
              Each lead will be scored for quality, intent, and closing probability.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={analyzeAllNewLeads}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
