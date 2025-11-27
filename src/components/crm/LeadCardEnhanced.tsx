import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Phone, Globe, Star, Mail, PhoneCall, Tag, 
  Flame, TrendingUp, TrendingDown, Clock, Sparkles,
  Loader2, Edit2, Check, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface LeadCardEnhancedProps {
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

export const LeadCardEnhanced = ({
  lead,
  batchMode,
  isSelected,
  isAnalyzing,
  onSelect,
  onClick,
  onAnalyze,
  onQuickEmail,
  onQuickCall,
  onAutoTag,
  onUpdate,
}: LeadCardEnhancedProps) => {
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(lead.phone || "");
  const [hasAiAccess, setHasAiAccess] = useState(false);

  useEffect(() => {
    checkAiAccess();
  }, []);

  const checkAiAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('has_ai_access, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData) {
        setHasAiAccess(roleData.role === 'admin' || roleData.has_ai_access);
      }
    } catch (error) {
      console.error('Error checking AI access:', error);
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'hot': return 'border-l-4 border-l-red-500';
      case 'warm': return 'border-l-4 border-l-yellow-500';
      case 'cold': return 'border-l-4 border-l-blue-500';
      default: return '';
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'hot': return <Flame className="h-3 w-3 text-red-500" />;
      case 'warm': return <TrendingUp className="h-3 w-3 text-yellow-500" />;
      case 'cold': return <TrendingDown className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getActivityMessage = () => {
    if (!lead.ai_quality_score) {
      return { text: "Needs AI analysis", icon: Sparkles, color: "text-muted-foreground" };
    }
    
    if (lead.sentiment === 'hot' && lead.ai_quality_score >= 75) {
      return { text: "High priority - contact now!", icon: Flame, color: "text-red-500" };
    }
    
    if (lead.recommended_action) {
      return { text: lead.recommended_action.slice(0, 50) + "...", icon: Sparkles, color: "text-primary" };
    }
    
    if (lead.last_contacted_at) {
      const daysSince = Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) {
        return { text: `No contact in ${daysSince} days`, icon: Clock, color: "text-yellow-600" };
      }
    }
    
    return null;
  };

  const activityMessage = getActivityMessage();

  const handlePhoneSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('leads')
        .update({ phone: phoneValue })
        .eq('id', lead.id);

      if (error) throw error;

      onUpdate(lead.id, { phone: phoneValue });
      setEditingPhone(false);
      toast.success('Phone updated');
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Failed to update phone');
    }
  };

  const handlePhoneCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhoneValue(lead.phone || "");
    setEditingPhone(false);
  };

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover:shadow-md transition-all relative group",
        hasAiAccess && getSentimentColor(lead.sentiment),
        isSelected && "ring-2 ring-primary",
        isAnalyzing && "opacity-60"
      )}
      onClick={onClick}
    >
      {batchMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <div className={cn("space-y-2", batchMode && "ml-6")}>
        {/* Header with name and scores */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium line-clamp-1 text-sm flex-1">
            {lead.business_name}
          </h4>
          {hasAiAccess && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {getSentimentIcon(lead.sentiment)}
              {lead.ai_quality_score !== null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getScoreColor(lead.ai_quality_score))}
                    >
                      {lead.ai_quality_score}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>Quality: {lead.ai_quality_score}</p>
                      <p>Intent: {lead.ai_intent_score || 'N/A'}</p>
                      <p>Close Prob: {lead.closing_probability || 'N/A'}%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* AI Activity Highlight */}
        {hasAiAccess && activityMessage && (
          <div className={cn("text-xs flex items-center gap-1 p-1.5 bg-muted/50 rounded", activityMessage.color)}>
            <activityMessage.icon className="h-3 w-3" />
            <span className="line-clamp-1">{activityMessage.text}</span>
          </div>
        )}

        {/* Contact info with inline editing */}
        <div className="space-y-1 text-xs">
          {editingPhone ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Phone className="h-3 w-3 text-muted-foreground" />
              <Input
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value)}
                className="h-6 text-xs flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handlePhoneSave}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handlePhoneCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            lead.phone && (
              <div className="flex items-center gap-1 group/phone">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="truncate flex-1">{lead.phone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover/phone:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPhone(true);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )
          )}
          {lead.rating && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{lead.rating} ({lead.review_count || 0})</span>
            </div>
          )}
          {lead.last_contacted_at && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Tags and niche */}
        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">{lead.niche}</Badge>
          {hasAiAccess && lead.closing_probability !== null && (
            <Badge variant="secondary" className="text-xs">
              {lead.closing_probability}%
            </Badge>
          )}
          {lead.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {lead.tags && lead.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">+{lead.tags.length - 2}</Badge>
          )}
        </div>

        {/* Quick actions */}
        {!batchMode && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {lead.website && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onQuickEmail}
                title="Send email"
              >
                <Mail className="h-3 w-3" />
              </Button>
            )}
            {lead.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onQuickCall}
                title="Call"
              >
                <PhoneCall className="h-3 w-3" />
              </Button>
            )}
            {!lead.ai_quality_score && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 px-2", !hasAiAccess && "opacity-50")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasAiAccess) {
                          onAnalyze();
                        }
                      }}
                      disabled={!hasAiAccess}
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">AI Analyze Lead</p>
                    {!hasAiAccess && <p className="text-xs text-muted-foreground">Upgrade to PRO</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {(!lead.tags || lead.tags.length === 0) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 px-2", !hasAiAccess && "opacity-50")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasAiAccess) {
                          onAutoTag(e);
                        }
                      }}
                      disabled={!hasAiAccess}
                    >
                      <Tag className="h-3 w-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">Auto-tag with AI</p>
                    {!hasAiAccess && <p className="text-xs text-muted-foreground">Upgrade to PRO</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
