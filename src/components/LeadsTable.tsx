import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Tag, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
}

interface LeadsTableProps {
  leads: Lead[];
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

export const LeadsTable = ({ leads, onUpdateLead }: LeadsTableProps) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [tagInput, setTagInput] = useState("");

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Leads ({leads.length})</h2>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Niche</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                  No leads yet. Use the search form to fetch leads.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
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
                      {lead.phone && <div>{lead.phone}</div>}
                      {lead.website && (
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
