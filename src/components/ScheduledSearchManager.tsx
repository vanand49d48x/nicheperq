import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  isActive,
  nextRunAt,
  lastRunAt,
  onUpdate,
}: ScheduledSearchManagerProps) => {
  const [frequency, setFrequency] = useState(scheduleFrequency || 'weekly');
  const [enabled, setEnabled] = useState(isScheduled);
  const [active, setActive] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggleSchedule = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const nextRun = checked ? calculateNextRun(frequency) : null;
      
      const { error } = await supabase
        .from('saved_searches')
        .update({
          is_scheduled: checked,
          schedule_frequency: frequency,
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
          ? `Scheduled search every ${frequency}` 
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
      const nextRun = calculateNextRun(newFrequency);
      
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

  const calculateNextRun = (freq: string): string => {
    const now = new Date();
    switch (freq) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
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
            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={active}
                  onCheckedChange={handleToggleActive}
                  disabled={isUpdating}
                />
                <Label className="text-sm">
                  {active ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Play className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600">
                      <Pause className="h-3 w-3" /> Paused
                    </span>
                  )}
                </Label>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
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