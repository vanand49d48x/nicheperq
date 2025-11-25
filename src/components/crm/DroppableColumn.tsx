import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  leads: any[];
}

export const DroppableColumn = ({ id, children, className, leads }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const leadIds = leads.map(lead => lead.id);

  return (
    <SortableContext id={id} items={leadIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          className,
          "transition-colors duration-200",
          isOver && "ring-2 ring-primary ring-opacity-50 bg-primary/5"
        )}
      >
        {children}
      </div>
    </SortableContext>
  );
};
