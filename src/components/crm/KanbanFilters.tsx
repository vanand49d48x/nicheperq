import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, MapPin, Tag, Sparkles, Flame, X, Search, Briefcase, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface KanbanFiltersProps {
  activeFilters: {
    rating?: number;
    sentiment?: string;
    hasAnalysis?: boolean;
    tags?: string[];
    location?: string;
    name?: string;
    niche?: string;
    dateFrom?: string;
    dateTo?: string;
    lexicalSearch?: string;
  };
  onFilterChange: (filters: any) => void;
  availableTags: string[];
  availableLocations: string[];
  availableNiches: string[];
}

export const KanbanFilters = ({ 
  activeFilters, 
  onFilterChange,
  availableTags,
  availableLocations,
  availableNiches
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

  const setNicheFilter = (niche: string) => {
    if (activeFilters.niche === niche) {
      const { niche: _, ...rest } = activeFilters;
      onFilterChange(rest);
    } else {
      onFilterChange({ ...activeFilters, niche });
    }
  };

  const handleNameChange = (value: string) => {
    if (value) {
      onFilterChange({ ...activeFilters, name: value });
    } else {
      const { name, ...rest } = activeFilters;
      onFilterChange(rest);
    }
  };

  const handleLexicalSearchChange = (value: string) => {
    if (value) {
      onFilterChange({ ...activeFilters, lexicalSearch: value });
    } else {
      const { lexicalSearch, ...rest } = activeFilters;
      onFilterChange(rest);
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    if (date) {
      onFilterChange({ ...activeFilters, dateFrom: format(date, 'yyyy-MM-dd') });
    } else {
      const { dateFrom, ...rest } = activeFilters;
      onFilterChange(rest);
    }
  };

  const handleDateToChange = (date: Date | undefined) => {
    if (date) {
      onFilterChange({ ...activeFilters, dateTo: format(date, 'yyyy-MM-dd') });
    } else {
      const { dateTo, ...rest } = activeFilters;
      onFilterChange(rest);
    }
  };

  return (
    <div className="mb-4 bg-muted/30 rounded-lg p-3 border space-y-3">
      {/* Search Inputs Row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search by name..."
          value={activeFilters.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-48 h-9"
        />
        <Input
          placeholder="Lexical search (all fields)..."
          value={activeFilters.lexicalSearch || ''}
          onChange={(e) => handleLexicalSearchChange(e.target.value)}
          className="w-64 h-9"
        />
      </div>

      {/* Filter Buttons Row */}
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

        {availableNiches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Briefcase className="h-3 w-3" />
                Niche
                {activeFilters.niche && (
                  <Badge variant="secondary" className="ml-1">1</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
              {availableNiches.map(niche => (
                <DropdownMenuItem
                  key={niche}
                  onClick={() => setNicheFilter(niche)}
                  className={activeFilters.niche === niche ? "bg-primary/10" : ""}
                >
                  {activeFilters.niche === niche && "✓ "}
                  {niche}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-3 w-3" />
              Date Range
              {(activeFilters.dateFrom || activeFilters.dateTo) && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilters.dateFrom && activeFilters.dateTo ? '2' : '1'}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <CalendarComponent
                  mode="single"
                  selected={activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : undefined}
                  onSelect={handleDateFromChange}
                  initialFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <CalendarComponent
                  mode="single"
                  selected={activeFilters.dateTo ? new Date(activeFilters.dateTo) : undefined}
                  onSelect={handleDateToChange}
                  initialFocus
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
          {activeFilters.name && (
            <Badge variant="secondary">Name: {activeFilters.name}</Badge>
          )}
          {activeFilters.lexicalSearch && (
            <Badge variant="secondary">Search: {activeFilters.lexicalSearch}</Badge>
          )}
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
          {activeFilters.niche && (
            <Badge variant="secondary">Niche: {activeFilters.niche}</Badge>
          )}
          {activeFilters.dateFrom && (
            <Badge variant="secondary">From: {format(new Date(activeFilters.dateFrom), 'MMM d, yyyy')}</Badge>
          )}
          {activeFilters.dateTo && (
            <Badge variant="secondary">To: {format(new Date(activeFilters.dateTo), 'MMM d, yyyy')}</Badge>
          )}
        </div>
      )}
    </div>
  );
};
