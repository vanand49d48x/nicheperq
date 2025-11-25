import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { LeadCardEnhanced } from "./LeadCardEnhanced";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DraggableLeadCardProps {
  lead: any;
  batchMode: boolean;
  isSelected: boolean;
  isAnalyzing: boolean;
  onSelect: () => void;
  onClick: () => void;
  onAnalyze: () => void;
  onQuickEmail: (e: React.MouseEvent) => void;
  onQuickCall: (e: React.MouseEvent) => void;
  onAutoTag: (e: React.MouseEvent) => void;
  onUpdate: (leadId: string, updates: any) => void;
}

export const DraggableLeadCard = (props: DraggableLeadCardProps) => {
  const { lead, batchMode } = props;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id: lead.id,
    disabled: batchMode, // Disable dragging in batch mode
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <LeadCardEnhanced {...props} />
      </div>
    </TooltipProvider>
  );
};
