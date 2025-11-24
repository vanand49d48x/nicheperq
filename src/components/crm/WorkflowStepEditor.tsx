import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GripVertical, Mail, Clock, Play, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowStep {
  id: string;
  action_type: string;
  step_order: number;
  delay_days: number;
  email_type?: string;
  tone?: string;
  ai_prompt_hint?: string;
  next_status?: string;
}

interface WorkflowStepEditorProps {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

interface SortableStepProps {
  step: WorkflowStep;
  index: number;
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onDelete: () => void;
}

function SortableStep({ step, index, onUpdate, onDelete }: SortableStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStepIcon = () => {
    switch (step.action_type) {
      case "email":
        return <Mail className="h-4 w-4 text-primary" />;
      case "delay":
        return <Clock className="h-4 w-4 text-accent" />;
      case "status":
        return <Play className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStepLabel = () => {
    switch (step.action_type) {
      case "email":
        return "Send Email";
      case "delay":
        return "Wait";
      case "status":
        return "Update Status";
      default:
        return step.action_type;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn("mb-3", isDragging && "shadow-lg")}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <Badge variant="secondary" className="shrink-0">
              Step {index + 1}
            </Badge>
            
            <div className="flex items-center gap-2 flex-1">
              {getStepIcon()}
              <span className="font-semibold text-sm">{getStepLabel()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {!isExpanded && (
            <div className="mt-2 text-xs text-muted-foreground ml-10">
              {step.action_type === "email" && (
                <span>
                  {step.email_type || "follow_up"} • {step.tone || "professional"}
                  {step.delay_days > 0 && ` • Wait ${step.delay_days} day${step.delay_days !== 1 ? 's' : ''} before sending`}
                </span>
              )}
              {step.action_type === "delay" && (
                <span>Wait {step.delay_days} day{step.delay_days !== 1 ? 's' : ''} then continue</span>
              )}
              {step.action_type === "status" && (
                <span>Change status to: {step.next_status || "contacted"}</span>
              )}
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <CardContent className="px-4 pb-4 ml-10">
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Delay (days)</Label>
                  <Input
                    type="number"
                    value={step.delay_days}
                    onChange={(e) => onUpdate({ delay_days: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {step.action_type === "email" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Email Type</Label>
                      <Select
                        value={step.email_type || "follow_up"}
                        onValueChange={(value) => onUpdate({ email_type: value })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial_outreach">Initial Outreach</SelectItem>
                          <SelectItem value="follow_up">Follow-up</SelectItem>
                          <SelectItem value="meeting_request">Meeting Request</SelectItem>
                          <SelectItem value="partnership_pitch">Partnership Pitch</SelectItem>
                          <SelectItem value="check_in">Check-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Tone</Label>
                      <Select
                        value={step.tone || "professional"}
                        onValueChange={(value) => onUpdate({ tone: value })}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Email Content Hint (for AI)</Label>
                    <Textarea
                      value={step.ai_prompt_hint || ""}
                      onChange={(e) => onUpdate({ ai_prompt_hint: e.target.value })}
                      placeholder="e.g., Introduce our service and ask if they're interested in a quick call"
                      className="text-sm min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will use this hint to generate personalized emails for each lead
                    </p>
                  </div>
                </>
              )}

              {step.action_type === "status" && (
                <div className="space-y-2">
                  <Label className="text-xs">New Status</Label>
                  <Select
                    value={step.next_status || "contacted"}
                    onValueChange={(value) => onUpdate({ next_status: value })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="attempted">Attempted</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="in_conversation">In Conversation</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="active_partner">Active Partner</SelectItem>
                      <SelectItem value="do_not_contact">Do Not Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function WorkflowStepEditor({ steps, onChange }: WorkflowStepEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        step_order: index + 1,
      }));

      onChange(reorderedSteps);
    }
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    onChange(
      steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const deleteStep = (stepId: string) => {
    const updatedSteps = steps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({
        ...step,
        step_order: index + 1,
      }));
    onChange(updatedSteps);
  };

  const addStep = (actionType: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      action_type: actionType,
      step_order: steps.length + 1,
      delay_days: actionType === "delay" ? 3 : 0,
      email_type: actionType === "email" ? "follow_up" : undefined,
      tone: actionType === "email" ? "professional" : undefined,
      ai_prompt_hint: actionType === "email" ? "" : undefined,
      next_status: actionType === "status" ? "contacted" : undefined,
    };
    onChange([...steps, newStep]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Workflow Steps</h3>
          <p className="text-xs text-muted-foreground">Drag to reorder • Click to edit</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => addStep("email")}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Mail className="h-3 w-3" />
            Add Email
          </Button>
          <Button
            onClick={() => addStep("delay")}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Clock className="h-3 w-3" />
            Add Wait
          </Button>
          <Button
            onClick={() => addStep("status")}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Play className="h-3 w-3" />
            Add Status
          </Button>
        </div>
      </div>

      {steps.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground mb-4">No steps yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first step to start building your workflow
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {steps.map((step, index) => (
              <SortableStep
                key={step.id}
                step={step}
                index={index}
                onUpdate={(updates) => updateStep(step.id, updates)}
                onDelete={() => deleteStep(step.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
