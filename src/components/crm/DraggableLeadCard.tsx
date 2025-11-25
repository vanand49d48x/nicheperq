import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadCardEnhanced } from "./LeadCardEnhanced";

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
    transition,
    isDragging,
  } = useSortable({ 
    id: lead.id,
    disabled: batchMode, // Disable dragging in batch mode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <LeadCardEnhanced {...props} />
    </div>
  );
};
