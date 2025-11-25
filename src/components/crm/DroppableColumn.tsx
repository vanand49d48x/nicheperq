import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const DroppableColumn = ({ id, children, className }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
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
  );
};
