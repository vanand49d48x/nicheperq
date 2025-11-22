import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink, Tag, StickyNote, ChevronLeft, ChevronRight, UserPlus, Trash2, Lock, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isMaskedPhone, isMaskedWebsite } from "@/lib/dataMasking";
import { Link } from "react-router-dom";

interface Lead {
  id: string;
  niche: string;
  business_name: string;
  address: string | null;
  city: string;
  state: string | null;
  zipcode: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_status?: string | null;
  is_preview?: boolean;
}

interface LeadsTableProps {
  leads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const statusColors = {
  new: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  attempted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  connected: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_conversation: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  active_partner: "bg-green-500/10 text-green-600 border-green-500/20",
  do_not_contact: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusLabels = {
  new: "New",
  attempted: "Attempted",
  connected: "Connected",
  in_conversation: "In Conversation",
  active_partner: "Active Partner",
  do_not_contact: "Do Not Contact",
};

export const LeadsTable = ({ 
  leads, 
  onUpdateLead, 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange 
}: LeadsTableProps) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleExport = () => {
    const csv = [
      ["Business Name", "Niche", "City", "Address", "Phone", "Website", "Rating", "Reviews", "Tags", "Notes"],
      ...leads.map((lead) => [
        lead.business_name,
        lead.niche,
        lead.city,
        lead.address || "",
        lead.phone || "",
        lead.website || "",
        lead.rating?.toString() || "",
        lead.review_count?.toString() || "",
        lead.tags.join("; "),
        lead.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleAddTag = (leadId: string, currentTags: string[]) => {
    if (tagInput.trim()) {
      onUpdateLead(leadId, { tags: [...currentTags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (leadId: string, currentTags: string[], tagToRemove: string) => {
    onUpdateLead(leadId, { tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const handleSaveNotes = (leadId: string) => {
    onUpdateLead(leadId, { notes: notesValue });
    setEditingNotes(null);
  };

  const handleAddToPipeline = (leadId: string) => {
    onUpdateLead(leadId, { contact_status: "new" });
  };

  const handleBulkAddToPipeline = () => {
    selectedLeads.forEach((leadId) => {
      onUpdateLead(leadId, { contact_status: "new" });
    });
    setSelectedLeads(new Set());
    setShowBulkActions(false);
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
      setShowBulkActions(true);
    }
  };

  return (
    <div className="space-y-4">
      {showBulkActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedLeads.size} selected</Badge>
            <span className="text-sm text-muted-foreground">
              Add selected leads to your CRM pipeline
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setSelectedLeads(new Set()); setShowBulkActions(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleBulkAddToPipeline} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add to Pipeline
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Leads ({leads.length})</h2>
          {leads.some(l => l.is_preview) && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Preview Mode
            </Badge>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {onPageChange && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLeads.size === leads.length && leads.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                  No leads yet. Use the search form to fetch leads.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.business_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lead.niche}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{lead.city}{lead.state ? `, ${lead.state}` : ""}</div>
                      {lead.address && <div className="text-muted-foreground text-xs">{lead.address}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <span>{lead.phone}</span>
                          {isMaskedPhone(lead.phone) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Upgrade to see full phone number</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-2">
                          {isMaskedWebsite(lead.website) ? (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Website hidden</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Upgrade to see website</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              Website <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.rating && (
                      <div className="text-sm">
                        <div className="font-medium">⭐ {lead.rating}</div>
                        {lead.review_count && (
                          <div className="text-muted-foreground text-xs">
                            {lead.review_count} reviews
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.contact_status ? (
                      <Badge variant="outline" className={statusColors[lead.contact_status as keyof typeof statusColors]}>
                        {statusLabels[lead.contact_status as keyof typeof statusLabels]}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToPipeline(lead.id)}
                        className="gap-2"
                      >
                        <UserPlus className="h-3 w-3" />
                        Add to Pipeline
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {lead.tags.length > 0 && <span className="text-xs">({lead.tags.length})</span>}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Tags for {lead.business_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag..."
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddTag(lead.id, lead.tags);
                                }
                              }}
                            />
                            <Button onClick={() => handleAddTag(lead.id, lead.tags)}>Add</Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(lead.id, lead.tags, tag)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setEditingNotes(lead.id);
                            setNotesValue(lead.notes || "");
                          }}
                        >
                          <StickyNote className="h-3 w-3" />
                          Notes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Notes for {lead.business_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            placeholder="Add notes..."
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            rows={5}
                          />
                          <Button onClick={() => handleSaveNotes(lead.id)} className="w-full">
                            Save Notes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
