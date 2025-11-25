import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Globe, Star, ChevronRight, Sparkles, TrendingUp, TrendingDown, Flame, Mail, PhoneCall, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { KanbanFilters } from "./KanbanFilters";
import { ColumnSummaryCard } from "./ColumnSummaryCard";
import { LeadCardEnhanced } from "./LeadCardEnhanced";
import { DraggableLeadCard } from "./DraggableLeadCard";
import { DroppableColumn } from "./DroppableColumn";
import { StageManager } from "./StageManager";
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
  const [filters, setFilters] = useState<any>({});
  const [customColumns, setCustomColumns] = useState(columns);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Extract available tags and locations from leads
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    leads.forEach(lead => {
      lead.tags?.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [leads]);

  const availableLocations = useMemo(() => {
    const locationSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.city) locationSet.add(lead.city);
    });
    return Array.from(locationSet).sort();
  }, [leads]);

  // Apply filters to leads
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (filters.rating) {
      filtered = filtered.filter(l => l.rating && l.rating >= filters.rating);
    }
    if (filters.sentiment) {
      filtered = filtered.filter(l => l.sentiment === filters.sentiment);
    }
    if (filters.hasAnalysis === false) {
      filtered = filtered.filter(l => !l.ai_quality_score);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(l => 
        filters.tags.some((tag: string) => l.tags?.includes(tag))
      );
    }
    if (filters.location) {
      filtered = filtered.filter(l => l.city === filters.location);
    }

    return filtered;
  }, [leads, filters]);

  const getLeadsForColumn = (columnId: string) => {
    return filteredLeads.filter(lead => lead.contact_status === columnId);
  };

  // Filter columns based on statusFilter
  const visibleColumns = statusFilter 
    ? customColumns.filter(col => col.id === statusFilter)
    : customColumns;

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;
    
    // Find the lead to get its current status
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Only update if status actually changed
    if (lead.contact_status !== newStatus) {
      onStatusChange(leadId, newStatus);
      toast.success(`Lead moved to ${customColumns.find(c => c.id === newStatus)?.label}`);
    }
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {statusFilter && (
        <div className="mb-4 flex items-center justify-between bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm">
              Filtered: {customColumns.find(c => c.id === statusFilter)?.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Showing only {customColumns.find(c => c.id === statusFilter)?.label} contacts
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

      {/* Quick Filters */}
      <KanbanFilters
        activeFilters={filters}
        onFilterChange={setFilters}
        availableTags={availableTags}
        availableLocations={availableLocations}
      />
      
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

        <div className="flex items-center gap-2">
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

          <StageManager
            stages={customColumns}
            onStagesUpdate={setCustomColumns}
          />
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {visibleColumns.map((column) => {
            const columnLeads = getLeadsForColumn(column.id);
            
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <DroppableColumn
                  id={column.id}
                  leads={columnLeads}
                  className={cn("rounded-lg p-4 h-[calc(100vh-16rem)] flex flex-col", column.color)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{column.label}</h3>
                    <Badge variant="secondary">{columnLeads.length}</Badge>
                  </div>

                  {/* Column Summary Card */}
                  <ColumnSummaryCard leads={columnLeads} columnLabel={column.label} />

                  <div className="flex-1 mt-3 overflow-y-auto">
                    <div className="space-y-3 pr-4">
                      {columnLeads.map((lead) => (
                        <TooltipProvider key={lead.id}>
                          <DraggableLeadCard
                            lead={lead}
                            batchMode={batchMode}
                            isSelected={selectedLeads.has(lead.id)}
                            isAnalyzing={analyzingLeads.has(lead.id)}
                            onSelect={() => toggleLeadSelection(lead.id)}
                            onClick={() => !batchMode && setSelectedLead(lead)}
                            onAnalyze={() => analyzeLeadWithAI(lead.id)}
                            onQuickEmail={(e) => handleQuickEmail(lead, e)}
                            onQuickCall={(e) => handleQuickCall(lead, e)}
                            onAutoTag={(e) => handleAutoTag(lead.id, e)}
                            onUpdate={onLeadUpdate || (() => {})}
                          />
                        </TooltipProvider>
                      ))}

                      {columnLeads.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No contacts
                        </div>
                      )}
                    </div>
                  </div>
                </DroppableColumn>
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

      <DragOverlay>
        {activeLead && (
          <Card className="p-3 opacity-90 cursor-grabbing shadow-xl rotate-3">
            <h4 className="font-medium text-sm line-clamp-1">
              {activeLead.business_name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {activeLead.niche}
            </p>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
};
