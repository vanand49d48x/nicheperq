import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles, Mail, Phone } from "lucide-react";

interface ColumnSummaryCardProps {
  leads: any[];
  columnLabel: string;
}

export const ColumnSummaryCard = ({ leads, columnLabel }: ColumnSummaryCardProps) => {
  const totalLeads = leads.length;
  const analyzedLeads = leads.filter(l => l.ai_quality_score !== null).length;
  const avgRating = leads.filter(l => l.rating).length > 0
    ? (leads.reduce((sum, l) => sum + (l.rating || 0), 0) / leads.filter(l => l.rating).length).toFixed(1)
    : null;
  const avgQualityScore = analyzedLeads > 0
    ? Math.round(leads.reduce((sum, l) => sum + (l.ai_quality_score || 0), 0) / analyzedLeads)
    : null;
  const missingEmail = leads.filter(l => !l.website).length;
  const missingPhone = leads.filter(l => !l.phone).length;

  if (totalLeads === 0) return null;

  return (
    <Card className="p-3 mb-3 bg-background/50 border-dashed">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Summary</span>
          <Badge variant="secondary" className="text-xs">{totalLeads} leads</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-medium">{avgRating}</span>
            </div>
          )}
          
          {avgQualityScore && (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Score:</span>
              <span className="font-medium">{avgQualityScore}</span>
            </div>
          )}
          
          {missingEmail > 0 && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">No email:</span>
              <span className="font-medium">{missingEmail}</span>
            </div>
          )}
          
          {missingPhone > 0 && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">No phone:</span>
              <span className="font-medium">{missingPhone}</span>
            </div>
          )}
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Analyzed:</span>
            <span className="font-medium">{analyzedLeads} / {totalLeads}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
