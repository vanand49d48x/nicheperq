import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Globe, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactCard } from "./ContactCard";

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

  const getLeadsForColumn = (columnId: string) => {
    return leads.filter(lead => lead.contact_status === columnId);
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
                      <Card
                        key={lead.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <h4 className="font-medium mb-2 line-clamp-1">
                          {lead.business_name}
                        </h4>
                        
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

                        <Badge variant="outline" className="text-xs">
                          {lead.niche}
                        </Badge>

                        {column.id !== "active_partner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-3 gap-1"
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
