import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";

interface WorkflowSchedulingProps {
  preferredSendTime: string;
  timezone: string;
  respectBusinessHours: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  onUpdate: (field: string, value: any) => void;
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC (Universal)' },
];

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00:00`, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}` };
});

export default function WorkflowScheduling({
  preferredSendTime,
  timezone,
  respectBusinessHours,
  businessHoursStart,
  businessHoursEnd,
  onUpdate,
}: WorkflowSchedulingProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Email Scheduling</CardTitle>
        </div>
        <CardDescription>
          Control when workflow emails are sent to maximize engagement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Preferred Send Time</Label>
          <Select value={preferredSendTime} onValueChange={(v) => onUpdate('preferred_send_time', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Emails will be queued and sent at this time each day
          </p>
        </div>

        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={(v) => onUpdate('timezone', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Respect Business Hours</Label>
              <p className="text-xs text-muted-foreground">
                Only send emails during business hours
              </p>
            </div>
            <Switch
              checked={respectBusinessHours}
              onCheckedChange={(v) => onUpdate('respect_business_hours', v)}
            />
          </div>

          {respectBusinessHours && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={businessHoursStart} onValueChange={(v) => onUpdate('business_hours_start', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.slice(0, 18).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={businessHoursEnd} onValueChange={(v) => onUpdate('business_hours_end', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.slice(6, 24).map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-accent/30 p-3 rounded-lg">
          💡 <strong>Pro Tip:</strong> Sending emails between 9 AM - 11 AM or 2 PM - 4 PM typically yields higher open rates for B2B outreach.
        </div>
      </CardContent>
    </Card>
  );
}
