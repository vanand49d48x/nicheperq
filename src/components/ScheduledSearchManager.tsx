import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ScheduledSearchManagerProps {
  searchId: string;
  searchName: string;
  isScheduled: boolean;
  scheduleFrequency: string;
  scheduleTime: string;
  isActive: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  onUpdate: () => void;
}

export const ScheduledSearchManager = ({
  searchId,
  searchName,
  isScheduled,
  scheduleFrequency,
  scheduleTime,
  isActive,
  nextRunAt,
  lastRunAt,
  onUpdate,
}: ScheduledSearchManagerProps) => {
  const [frequency, setFrequency] = useState(scheduleFrequency || 'weekly');
  const [time, setTime] = useState(scheduleTime || '09:00');
  const [enabled, setEnabled] = useState(isScheduled);
  const [active, setActive] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleSchedule = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const nextRun = checked ? calculateNextRun(frequency, time) : null;
      
      const { error } = await supabase
        .from('saved_searches')
        .update({
          is_scheduled: checked,
          schedule_frequency: frequency,
          schedule_time: time,
          next_run_at: nextRun,
          is_active: checked,
        })
        .eq('id', searchId);

      if (error) throw error;

      setEnabled(checked);
      setActive(checked);
      toast({
        title: "Success",
        description: checked 
          ? `Scheduled search every ${frequency} at ${time}` 
          : "Scheduled search disabled",
      });
      onUpdate();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('saved_searches')
        .update({ is_active: checked })
        .eq('id', searchId);

      if (error) throw error;

      setActive(checked);
      toast({
        title: "Success",
        description: checked ? "Search activated" : "Search paused",
      });
      onUpdate();
    } catch (error) {
      console.error('Error toggling active state:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrequencyChange = async (newFrequency: string) => {
    setIsUpdating(true);
    try {
      const nextRun = calculateNextRun(newFrequency, time);
      
      const { error } = await supabase
        .from('saved_searches')
        .update({
          schedule_frequency: newFrequency,
          next_run_at: nextRun,
        })
        .eq('id', searchId);

      if (error) throw error;

      setFrequency(newFrequency);
      toast({
        title: "Success",
        description: `Schedule updated to ${newFrequency}`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast({
        title: "Error",
        description: "Failed to update frequency",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setIsUpdating(true);
    try {
      const nextRun = calculateNextRun(frequency, newTime);
      
      const { error } = await supabase
        .from('saved_searches')
        .update({
          schedule_time: newTime,
          next_run_at: nextRun,
        })
        .eq('id', searchId);

      if (error) throw error;

      setTime(newTime);
      toast({
        title: "Success",
        description: `Schedule time updated to ${newTime}`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating time:', error);
      toast({
        title: "Error",
        description: "Failed to update time",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateNextRun = (freq: string, scheduleTime: string): string => {
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If today's scheduled time has passed, move to next occurrence
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toISOString();
  };

  return (
    <Card className="p-4 border-l-4 border-l-primary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-semibold">Automated Schedule</h4>
              <p className="text-sm text-muted-foreground">Run this search automatically</p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggleSchedule}
            disabled={isUpdating}
          />
        </div>

        {enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex-1">
                <Label htmlFor="frequency" className="text-sm mb-2 block">
                  Frequency
                </Label>
                <Select value={frequency} onValueChange={handleFrequencyChange}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="time" className="text-sm mb-2 block">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">
                  Status:
                </Label>
                {active ? (
                  <Badge variant="default" className="gap-1">
                    <Play className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Pause className="h-3 w-3" /> Paused
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant={active ? "outline" : "default"}
                onClick={() => handleToggleActive(!active)}
                disabled={isUpdating}
                className="gap-2"
              >
                {active ? (
                  <>
                    <Pause className="h-3 w-3" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" />
                    Resume
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-3 text-sm flex-wrap">
              {nextRunAt && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Next run: {formatDistanceToNow(new Date(nextRunAt), { addSuffix: true })}
                </Badge>
              )}
              {lastRunAt && (
                <Badge variant="secondary" className="gap-1">
                  Last run: {formatDistanceToNow(new Date(lastRunAt), { addSuffix: true })}
                </Badge>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};