import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Globe, Star, ChevronRight, Sparkles, TrendingUp, TrendingDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContactCard } from "./ContactCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KanbanBoardProps {
  leads: any[];
  onStatusChange: (leadId: string, status: string) => void;
  onRefresh: () => void;
}

const columns = [
  { id: "new", label: "New", color: "bg-slate-100 dark:bg-slate-900" },
  { id: "attempted", label: "Contacted", color: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "connected", label: "Connected", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "in_conversation", label: "Meeting Scheduled", color: "bg-purple-50 dark:bg-purple-950" },
  { id: "active_partner", label: "Active Partner", color: "bg-green-50 dark:bg-green-950" },
];

export const KanbanBoard = ({ leads, onStatusChange, onRefresh }: KanbanBoardProps) => {
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [analyzingLeads, setAnalyzingLeads] = useState<Set<string>>(new Set());

  const getLeadsForColumn = (columnId: string) => {
    return leads.filter(lead => lead.contact_status === columnId);
  };

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
      const { data, error } = await supabase.functions.invoke('ai-analyze-lead', {
        body: { lead_id: leadId }
      });

      if (error) throw error;

      toast.success('AI analysis complete!');
      onRefresh();
    } catch (error) {
      console.error('Error analyzing lead:', error);
      toast.error('Failed to analyze lead');
    } finally {
      setAnalyzingLeads(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
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
                                "p-4 cursor-pointer hover:shadow-md transition-shadow",
                                getSentimentColor(lead.sentiment)
                              )}
                              onClick={() => setSelectedLead(lead)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium line-clamp-1 flex-1">
                                  {lead.business_name}
                                </h4>
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
                              
                              <div className="space-y-1 text-sm text-muted-foreground mb-3">
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

                              <div className="flex gap-2 items-center mb-3">
                                <Badge variant="outline" className="text-xs">
                                  {lead.niche}
                                </Badge>
                                {lead.closing_probability !== null && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {lead.closing_probability}% close
                                  </Badge>
                                )}
                              </div>

                              {!lead.ai_quality_score && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mb-2 gap-1"
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

                              {column.id !== "active_partner" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full gap-1"
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
                          {lead.recommended_action && (
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
    </>
  );
};
