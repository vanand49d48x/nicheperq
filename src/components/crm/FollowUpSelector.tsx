import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface FollowUpSelectorProps {
  leadId: string;
  currentDate: string | null;
  onUpdate: () => void;
}

export const FollowUpSelector = ({ leadId, currentDate, onUpdate }: FollowUpSelectorProps) => {
  const [date, setDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleQuickSelect = async (days: number) => {
    const newDate = addDays(new Date(), days);
    await updateFollowUp(newDate);
  };

  const updateFollowUp = async (newDate: Date | undefined) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ next_follow_up_at: newDate?.toISOString() || null })
        .eq('id', leadId);

      if (error) throw error;

      setDate(newDate);
      setIsOpen(false);
      onUpdate();

      toast({
        title: "Follow-up Updated",
        description: newDate 
          ? `Follow-up set for ${format(newDate, 'PPP')}`
          : "Follow-up reminder cleared",
      });
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to update follow-up",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Set reminder"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickSelect(1)}
            >
              Tomorrow
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickSelect(3)}
            >
              3 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleQuickSelect(7)}
            >
              1 Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => updateFollowUp(undefined)}
            >
              Clear Reminder
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={updateFollowUp}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            disabled={(date) => date < new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
