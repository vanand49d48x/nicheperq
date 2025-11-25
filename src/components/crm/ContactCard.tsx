import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Globe, 
  Star, 
  MapPin, 
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot
} from "lucide-react";
import { format } from "date-fns";
import { ContactStatusSelector } from "./ContactStatusSelector";
import { FollowUpSelector } from "./FollowUpSelector";
import { ContactNotes } from "./ContactNotes";
import { AIEmailComposer } from "./AIEmailComposer";
import { LeadAIPanel } from "./LeadAIPanel";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ContactCardProps {
  lead: any;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  isHighlighted?: boolean;
}

const statusColors = {
  new: "bg-slate-500",
  attempted: "bg-yellow-500",
  connected: "bg-blue-500",
  in_conversation: "bg-purple-500",
  active_partner: "bg-green-500",
  do_not_contact: "bg-red-500",
};

const statusLabels = {
  new: "New",
  attempted: "Attempted",
  connected: "Connected",
  in_conversation: "In Conversation",
  active_partner: "Active Partner",
  do_not_contact: "Do Not Contact",
};

export const ContactCard = ({ lead: initialLead, onStatusChange, onRefresh, isHighlighted = false }: ContactCardProps) => {
  const [isExpanded, setIsExpanded] = useState(isHighlighted);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [lead, setLead] = useState(initialLead);

  // Sync with parent lead updates
  useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  const handleLocalRefresh = async () => {
    // Fetch just this lead's updated data without triggering parent refresh
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .single();

    if (!error && updatedLead) {
      // Update local state only - this keeps the card in place
      setLead(updatedLead);
    }
  };

  return (
    <Card className={cn(
      "p-6 transition-all duration-300",
      isHighlighted 
        ? "border-2 border-primary shadow-xl ring-2 ring-primary/20" 
        : "hover:shadow-lg"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{lead.business_name}</h3>
            <Badge className={cn("text-white", statusColors[lead.contact_status as keyof typeof statusColors])}>
              {statusLabels[lead.contact_status as keyof typeof statusLabels]}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {lead.city}
            </span>
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a href={`tel:${lead.phone}`} className="hover:text-primary">
                  {lead.phone}
                </a>
              </span>
            )}
            {lead.website && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <a 
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Website
                </a>
              </span>
            )}
            {lead.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {lead.rating} ({lead.review_count || 0} reviews)
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{lead.niche}</Badge>
            {lead.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="pt-4 border-t">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details & Notes</TabsTrigger>
              <TabsTrigger value="ai-assistant" className="gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Status</label>
                  <ContactStatusSelector
                    currentStatus={lead.contact_status}
                    onChange={onStatusChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Follow-up Reminder</label>
                  <FollowUpSelector
                    leadId={lead.id}
                    currentDate={lead.next_follow_up_at}
                    onUpdate={onRefresh}
                  />
                </div>
              </div>

              {lead.last_contacted_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last contacted: {format(new Date(lead.last_contacted_at), 'PPp')}
                </p>
              )}

              {lead.next_follow_up_at && (
                <p className="text-sm text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Follow-up: {format(new Date(lead.next_follow_up_at), 'PPp')}
                </p>
              )}

              <ContactNotes leadId={lead.id} />
              
              <Button 
                onClick={() => setShowEmailComposer(true)} 
                className="w-full gap-2 mt-4"
                variant="outline"
              >
                <Sparkles className="h-4 w-4" />
                Draft AI Email
              </Button>
            </TabsContent>

            <TabsContent value="ai-assistant" className="mt-4">
              <LeadAIPanel lead={lead} onRefresh={handleLocalRefresh} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Email Composer</DialogTitle>
          </DialogHeader>
          <AIEmailComposer
            leadId={lead.id}
            leadName={lead.business_name}
            onEmailSent={() => {
              setShowEmailComposer(false);
              onRefresh();
            }}
            onClose={() => setShowEmailComposer(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
