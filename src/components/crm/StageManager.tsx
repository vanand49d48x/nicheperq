import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Stage {
  id: string;
  label: string;
  color: string;
}

interface StageManagerProps {
  stages: Stage[];
  onStagesUpdate: (stages: Stage[]) => void;
}

export const StageManager = ({ stages, onStagesUpdate }: StageManagerProps) => {
  const [open, setOpen] = useState(false);
  const [editingStages, setEditingStages] = useState<Stage[]>(stages);
  const [newStageName, setNewStageName] = useState("");

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      toast.error("Stage name cannot be empty");
      return;
    }

    const newStage: Stage = {
      id: newStageName.toLowerCase().replace(/\s+/g, '_'),
      label: newStageName,
      color: "bg-gray-100 dark:bg-gray-900"
    };

    setEditingStages([...editingStages, newStage]);
    setNewStageName("");
  };

  const handleRemoveStage = (stageId: string) => {
    if (editingStages.length <= 3) {
      toast.error("You must have at least 3 stages");
      return;
    }
    setEditingStages(editingStages.filter(s => s.id !== stageId));
  };

  const handleRenameStage = (stageId: string, newLabel: string) => {
    setEditingStages(editingStages.map(s => 
      s.id === stageId ? { ...s, label: newLabel } : s
    ));
  };

  const handleSave = () => {
    onStagesUpdate(editingStages);
    setOpen(false);
    toast.success("Pipeline stages updated");
  };

  const handleCancel = () => {
    setEditingStages(stages);
    setNewStageName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Manage Stages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Pipeline Stages</DialogTitle>
          <DialogDescription>
            Customize your pipeline stages to match your workflow. Drag to reorder, click to rename, or add new stages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            {editingStages.map((stage, index) => (
              <Card key={stage.id} className="p-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <Badge variant="secondary">{index + 1}</Badge>
                  <Input
                    value={stage.label}
                    onChange={(e) => handleRenameStage(stage.id, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStage(stage.id)}
                    disabled={editingStages.length <= 3}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-3 border-dashed">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New stage name..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddStage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleAddStage} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </div>
          </Card>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
