import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Tag, Sparkles, Flame, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanFiltersProps {
  activeFilters: {
    rating?: number;
    sentiment?: string;
    hasAnalysis?: boolean;
    tags?: string[];
    location?: string;
  };
  onFilterChange: (filters: any) => void;
  availableTags: string[];
  availableLocations: string[];
}

export const KanbanFilters = ({ 
  activeFilters, 
  onFilterChange,
  availableTags,
  availableLocations 
}: KanbanFiltersProps) => {
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  const clearFilters = () => {
    onFilterChange({});
  };

  const toggleRating = () => {
    if (activeFilters.rating) {
      const { rating, ...rest } = activeFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...activeFilters, rating: 4.5 });
    }
  };

  const toggleHotLeads = () => {
    if (activeFilters.sentiment === 'hot') {
      const { sentiment, ...rest } = activeFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...activeFilters, sentiment: 'hot' });
    }
  };

  const toggleNeedsAnalysis = () => {
    if (activeFilters.hasAnalysis === false) {
      const { hasAnalysis, ...rest } = activeFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...activeFilters, hasAnalysis: false });
    }
  };

  const addTagFilter = (tag: string) => {
    const currentTags = activeFilters.tags || [];
    if (currentTags.includes(tag)) {
      const newTags = currentTags.filter(t => t !== tag);
      if (newTags.length === 0) {
        const { tags, ...rest } = activeFilters;
        onFilterChange(rest);
      } else {
        onFilterChange({ ...activeFilters, tags: newTags });
      }
    } else {
      onFilterChange({ ...activeFilters, tags: [...currentTags, tag] });
    }
  };

  const setLocationFilter = (location: string) => {
    if (activeFilters.location === location) {
      const { location: _, ...rest } = activeFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...activeFilters, location });
    }
  };

  return (
    <div className="mb-4 bg-muted/30 rounded-lg p-3 border">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium mr-2">Quick Filters:</span>
        
        <Button
          variant={activeFilters.rating ? "default" : "outline"}
          size="sm"
          onClick={toggleRating}
          className="gap-2"
        >
          <Star className="h-3 w-3" />
          Rating 4.5+
        </Button>

        <Button
          variant={activeFilters.sentiment === 'hot' ? "default" : "outline"}
          size="sm"
          onClick={toggleHotLeads}
          className="gap-2"
        >
          <Flame className="h-3 w-3" />
          Hot Leads
        </Button>

        <Button
          variant={activeFilters.hasAnalysis === false ? "default" : "outline"}
          size="sm"
          onClick={toggleNeedsAnalysis}
          className="gap-2"
        >
          <Sparkles className="h-3 w-3" />
          Needs Analysis
        </Button>

        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-3 w-3" />
                Tags
                {activeFilters.tags && activeFilters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilters.tags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
              {availableTags.map(tag => (
                <DropdownMenuItem
                  key={tag}
                  onClick={() => addTagFilter(tag)}
                  className={activeFilters.tags?.includes(tag) ? "bg-primary/10" : ""}
                >
                  {activeFilters.tags?.includes(tag) && "✓ "}
                  {tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {availableLocations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MapPin className="h-3 w-3" />
                Location
                {activeFilters.location && (
                  <Badge variant="secondary" className="ml-1">1</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
              {availableLocations.map(location => (
                <DropdownMenuItem
                  key={location}
                  onClick={() => setLocationFilter(location)}
                  className={activeFilters.location === location ? "bg-primary/10" : ""}
                >
                  {activeFilters.location === location && "✓ "}
                  {location}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2 ml-auto"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {activeFilters.rating && (
            <Badge variant="secondary">Rating ≥ {activeFilters.rating}</Badge>
          )}
          {activeFilters.sentiment && (
            <Badge variant="secondary">Sentiment: {activeFilters.sentiment}</Badge>
          )}
          {activeFilters.hasAnalysis === false && (
            <Badge variant="secondary">Needs AI Analysis</Badge>
          )}
          {activeFilters.tags?.map(tag => (
            <Badge key={tag} variant="secondary">Tag: {tag}</Badge>
          ))}
          {activeFilters.location && (
            <Badge variant="secondary">Location: {activeFilters.location}</Badge>
          )}
        </div>
      )}
    </div>
  );
};
