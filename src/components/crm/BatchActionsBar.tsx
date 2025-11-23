import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, ChevronRight, Tag, Workflow } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  if (selectedLeads.size === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border-2 border-primary shadow-2xl rounded-lg p-4 flex items-center gap-4 min-w-[400px]">
      <Badge variant="secondary" className="text-base px-3 py-1">
        {selectedLeads.size} selected
      </Badge>

      <div className="flex gap-2 flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronRight className="h-4 w-4" />
              Change Status
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

        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Workflow className="h-4 w-4" />
          Enroll in Workflow
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
  );
};
