import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { X, ChevronRight, Tag, Workflow, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface BatchActionsBarProps {
  selectedLeads: Set<string>;
  onClearSelection: () => void;
  onRefresh: () => void;
}

const statusOptions = [
  { id: "new", label: "New" },
  { id: "attempted", label: "Contacted" },
  { id: "connected", label: "Connected" },
  { id: "in_conversation", label: "Meeting Scheduled" },
  { id: "active_partner", label: "Active Partner" },
];

export const BatchActionsBar = ({ selectedLeads, onClearSelection, onRefresh }: BatchActionsBarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const handleBulkStatusUpdate = async (newStatus: string) => {
    const leadIds = Array.from(selectedLeads);
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ contact_status: newStatus })
        .in('id', leadIds);

      if (error) throw error;

      toast.success(`Updated ${leadIds.length} leads to ${statusOptions.find(s => s.id === newStatus)?.label}`);
      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error updating leads:', error);
      toast.error('Failed to update leads');
    }
  };

  const handleBulkAddTag = async (tag: string) => {
    const leadIds = Array.from(selectedLeads);
    
    try {
      // Fetch current tags for each lead
      const { data: leads, error: fetchError } = await supabase
        .from('leads')
        .select('id, tags')
        .in('id', leadIds);

      if (fetchError) throw fetchError;

      // Update each lead with new tag
      const updates = leads?.map(lead => ({
        id: lead.id,
        tags: [...(lead.tags || []), tag].filter((t, i, arr) => arr.indexOf(t) === i) // Remove duplicates
      }));

      if (updates) {
        for (const update of updates) {
          await supabase
            .from('leads')
            .update({ tags: update.tags })
            .eq('id', update.id);
        }
      }

      toast.success(`Added tag "${tag}" to ${leadIds.length} leads`);
      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error adding tags:', error);
      toast.error('Failed to add tags');
    }
  };

  const handleBulkDelete = async () => {
    const leadIds = Array.from(selectedLeads);
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (error) throw error;

      toast.success(`Deleted ${leadIds.length} leads`);
      onRefresh();
      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    }
  };

  const handleBulkAnalyze = async () => {
    const leadIds = Array.from(selectedLeads);
    setIsAnalyzing(true);
    
    try {
      let successCount = 0;
      let failCount = 0;

      for (const leadId of leadIds) {
        try {
          const { error } = await supabase.functions.invoke('ai-analyze-lead', {
            body: { lead_id: leadId }
          });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Error analyzing lead ${leadId}:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success(`Successfully analyzed ${successCount} leads!`);
      } else {
        toast.warning(`Analyzed ${successCount} leads, ${failCount} failed`);
      }

      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error in bulk analyze:', error);
      toast.error('Failed to analyze leads');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (selectedLeads.size === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border-2 border-primary shadow-2xl rounded-lg p-4 flex items-center gap-4 min-w-[600px]">
        <Badge variant="secondary" className="text-base px-3 py-1">
          {selectedLeads.size} selected
        </Badge>

        <div className="flex gap-2 flex-1 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronRight className="h-4 w-4" />
                Move Stage
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {statusOptions.map(status => (
                <DropdownMenuItem
                  key={status.id}
                  onClick={() => handleBulkStatusUpdate(status.id)}
                >
                  {status.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Add Tag
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAddTag('Priority')}>
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAddTag('Follow Up')}>
                Follow Up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAddTag('Hot Lead')}>
                Hot Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAddTag('Needs Review')}>
                Needs Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleBulkAnalyze}
            disabled={isAnalyzing}
          >
            <Sparkles className="h-4 w-4" />
            AI Analyze
          </Button>

          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Workflow className="h-4 w-4" />
            Workflow
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedLeads.size} leads?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected leads and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
