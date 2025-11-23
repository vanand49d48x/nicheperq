import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AIEmailComposer } from "./AIEmailComposer";

interface ContactRecommendation {
  id: string;
  business_name: string;
  priority: 'low' | 'medium' | 'high';
  suggested_action: string;
  reasoning: string;
  contact_status?: string;
  rating?: number;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  niche?: string;
}

interface ChatContactCardProps {
  contact: ContactRecommendation;
}

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

export const ChatContactCard = ({ contact }: ChatContactCardProps) => {
  const navigate = useNavigate();
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  return (
    <>
      <Dialog open={showEmailComposer} onOpenChange={setShowEmailComposer}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <AIEmailComposer
            leadId={contact.id}
            leadName={contact.business_name}
            onEmailSent={() => setShowEmailComposer(false)}
            onClose={() => setShowEmailComposer(false)}
          />
        </DialogContent>
      </Dialog>
    
    <Card className="p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{contact.business_name}</h4>
            <Badge variant={priorityColors[contact.priority]} className="text-xs">
              {contact.priority}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            {contact.rating && (
              <div className="flex items-center gap-1">
                <span>⭐ {contact.rating.toFixed(1)}</span>
                {contact.city && <span>• {contact.city}</span>}
              </div>
            )}
            {contact.niche && (
              <div className="text-xs">{contact.niche}</div>
            )}
          </div>

          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-primary">→ {contact.suggested_action}</p>
            <p className="text-xs text-muted-foreground">{contact.reasoning}</p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {contact.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.open(`tel:${contact.phone}`)}
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
            )}
            {contact.website && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => window.open(contact.website, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowEmailComposer(true)}
            >
              <Mail className="h-3 w-3 mr-1" />
              Draft Email
            </Button>
          </div>
        </div>
      </div>
    </Card>
    </>
  );
};
