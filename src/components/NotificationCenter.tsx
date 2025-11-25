import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'lead' | 'workflow' | 'email' | 'automation';
  title: string;
  description: string;
  timestamp: string;
  leadName?: string;
  isRead: boolean;
}

export function NotificationCenter() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchActivities();

    // Set up realtime subscriptions
    const leadChannel = supabase
      .channel('lead-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        () => fetchActivities()
      )
      .subscribe();

    const emailChannel = supabase
      .channel('email-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_email_drafts',
        },
        () => fetchActivities()
      )
      .subscribe();

    const workflowChannel = supabase
      .channel('workflow-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_enrollments',
        },
        () => fetchActivities()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadChannel);
      supabase.removeChannel(emailChannel);
      supabase.removeChannel(workflowChannel);
    };
  }, []);

  const fetchActivities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allActivities: Activity[] = [];

    // Fetch recent lead interactions
    const { data: interactions } = await supabase
      .from('lead_interactions')
      .select('*, leads(business_name)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (interactions) {
      interactions.forEach((int: any) => {
        allActivities.push({
          id: `lead-${int.id}`,
          type: 'lead',
          title: getInteractionTitle(int.interaction_type),
          description: int.leads?.business_name || 'Unknown Lead',
          timestamp: int.occurred_at,
          leadName: int.leads?.business_name,
          isRead: false,
        });
      });
    }

    // Fetch recent email activities
    const { data: emails } = await supabase
      .from('ai_email_drafts')
      .select('*, leads(business_name)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (emails) {
      emails.forEach((email: any) => {
        if (email.sent_at) {
          allActivities.push({
            id: `email-${email.id}`,
            type: 'email',
            title: email.opened_at ? 'Email Opened' : 'Email Sent',
            description: `${email.subject} - ${email.leads?.business_name || 'Unknown Lead'}`,
            timestamp: email.opened_at || email.sent_at,
            leadName: email.leads?.business_name,
            isRead: false,
          });
        }
      });
    }

    // Fetch recent workflow enrollments
    const { data: enrollments } = await supabase
      .from('workflow_enrollments')
      .select('*, leads(business_name), ai_workflows(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (enrollments) {
      enrollments.forEach((enr: any) => {
        allActivities.push({
          id: `workflow-${enr.id}`,
          type: 'workflow',
          title: `Enrolled in ${enr.ai_workflows?.name || 'Workflow'}`,
          description: enr.leads?.business_name || 'Unknown Lead',
          timestamp: enr.enrolled_at,
          leadName: enr.leads?.business_name,
          isRead: false,
        });
      });
    }

    // Fetch recent automation logs
    const { data: automations } = await supabase
      .from('ai_automation_logs')
      .select('*, leads(business_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (automations) {
      automations.forEach((auto: any) => {
        allActivities.push({
          id: `auto-${auto.id}`,
          type: 'automation',
          title: `AI ${auto.action_type}`,
          description: auto.leads?.business_name || 'Lead Activity',
          timestamp: auto.created_at,
          leadName: auto.leads?.business_name,
          isRead: false,
        });
      });
    }

    // Sort all activities by timestamp
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(allActivities.slice(0, 20));
    setUnreadCount(allActivities.length);
  };

  const getInteractionTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'workflow_enrolled': 'Workflow Enrolled',
      'email_sent': 'Email Sent',
      'status_changed': 'Status Changed',
      'note_added': 'Note Added',
      'ai_analyzed': 'AI Analysis Complete',
    };
    return titles[type] || type;
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lead':
        return '👤';
      case 'workflow':
        return '⚡';
      case 'email':
        return '📧';
      case 'automation':
        return '🤖';
      default:
        return '•';
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
    setActivities(activities.map(a => ({ ...a, isRead: true })));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Activity Feed</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !activity.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!activity.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
