import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

interface ContactNotesProps {
  leadId: string;
}

export const ContactNotes = ({ leadId }: ContactNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [leadId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('contact_notes')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          note_text: newNote.trim(),
        });

      if (error) throw error;

      setNewNote("");
      setIsAdding(false);
      fetchNotes();

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      fetchNotes();

      toast({
        title: "Note Deleted",
        description: "Note has been removed",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notes & Activity
        </label>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="p-3 bg-muted/50">
          <Textarea
            placeholder="Called on Tuesday, good fit for partnership..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mb-2 min-h-[80px]"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={addNote} size="sm">
              Save Note
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewNote("");
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notes yet. Add your first note to track interactions.
          </p>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className="p-3">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(note.created_at), 'PPp')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(note.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
