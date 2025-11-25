import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, Play, Trash2, MapPin, Building2, Calendar, Filter, Search, X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ScheduledSearchManager } from "@/components/ScheduledSearchManager";
import { ScheduledSearchResults } from "@/components/ScheduledSearchResults";

interface SavedSearch {
  id: string;
  name: string;
  niche: string;
  city: string;
  radius: string;
  lead_count: number;
  created_at: string;
  last_run_at: string | null;
  is_scheduled: boolean;
  schedule_frequency: string;
  schedule_time: string;
  is_active: boolean;
  next_run_at: string | null;
}

interface Lead {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  state: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  created_at: string;
}

const History = () => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [selectedSearch, setSelectedSearch] = useState<SavedSearch | null>(null);
  const [searchLeads, setSearchLeads] = useState<Lead[]>([]);
  const [isLoadingSearchLeads, setIsLoadingSearchLeads] = useState(false);
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedSearches();
    fetchLeads();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    // Navigate to home with search params
    navigate('/', { 
      state: { 
        niche: search.niche, 
        city: search.city, 
        radius: search.radius 
      } 
    });
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSearches(searches.filter(s => s.id !== id));
      toast({
        title: "Success",
        description: "Saved search deleted",
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      });
    }
  };

  const handleSearchClick = async (search: SavedSearch) => {
    setSelectedSearch(search);
    setIsLoadingSearchLeads(true);
    
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('search_id', search.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchLeads(data || []);
    } catch (error) {
      console.error('Error fetching search leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSearchLeads(false);
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setNicheFilter("");
    setCityFilter("");
    setSearchText("");
  };

  // Get unique niches and cities for filter dropdowns
  const uniqueNiches = Array.from(new Set(searches.map(s => s.niche))).sort();
  const uniqueCities = Array.from(new Set(searches.map(s => s.city))).sort();

  // Filter searches based on criteria
  const filteredSearches = searches.filter(search => {
    // Date range filter
    if (dateFrom) {
      const searchDate = new Date(search.created_at);
      const fromDate = new Date(dateFrom);
      if (searchDate < fromDate) return false;
    }
    if (dateTo) {
      const searchDate = new Date(search.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      if (searchDate > toDate) return false;
    }

    // Niche filter
    if (nicheFilter && search.niche !== nicheFilter) return false;

    // City filter
    if (cityFilter && search.city !== cityFilter) return false;

    // Text search (search in name, niche, city)
    if (searchText) {
      const text = searchText.toLowerCase();
      const matchesName = search.name.toLowerCase().includes(text);
      const matchesNiche = search.niche.toLowerCase().includes(text);
      const matchesCity = search.city.toLowerCase().includes(text);
      if (!matchesName && !matchesNiche && !matchesCity) return false;
    }

    return true;
  });

  const activeFiltersCount = [dateFrom, dateTo, nicheFilter, cityFilter, searchText].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-7xl animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Search History</h1>
          </div>
          <p className="text-muted-foreground">
            Manage saved searches and view automated results
          </p>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="leads">All Leads</TabsTrigger>
            <TabsTrigger value="searches">Saved Searches</TabsTrigger>
            <TabsTrigger value="results">Automated Results</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-6">
            {isLoadingLeads ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-6 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <Card className="p-12 text-center">
                <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No leads found yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start searching for leads and they'll appear here
                </p>
                <Button onClick={() => navigate('/')}>
                  Find Leads
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {leads.map((lead) => (
                  <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
                    <h3 className="font-semibold mb-2 truncate">{lead.business_name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="truncate">{lead.niche}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{lead.city}{lead.state ? `, ${lead.state}` : ''}</span>
                      </div>
                      {lead.rating && (
                        <div className="flex items-center gap-1">
                          <span>⭐ {lead.rating}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="text-xs text-muted-foreground truncate">
                          📞 {lead.phone}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pt-2">
                        Found {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="searches" className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">{activeFiltersCount} active</Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Date From */}
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Niche Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Niche</label>
                  <select
                    value={nicheFilter}
                    onChange={(e) => setNicheFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">All Niches</option>
                    {uniqueNiches.map(niche => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Text Search */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name, niche, or city..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {dateFrom && (
                  <Badge variant="secondary" className="gap-2">
                    From: {format(new Date(dateFrom), 'MMM d, yyyy')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom("")} />
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="gap-2">
                    To: {format(new Date(dateTo), 'MMM d, yyyy')}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo("")} />
                  </Badge>
                )}
                {nicheFilter && (
                  <Badge variant="secondary" className="gap-2">
                    Niche: {nicheFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setNicheFilter("")} />
                  </Badge>
                )}
                {cityFilter && (
                  <Badge variant="secondary" className="gap-2">
                    City: {cityFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCityFilter("")} />
                  </Badge>
                )}
                {searchText && (
                  <Badge variant="secondary" className="gap-2">
                    Search: "{searchText}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchText("")} />
                  </Badge>
                )}
              </div>
            )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredSearches.length === 0 ? (
          <Card className="p-12 text-center">
            <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {activeFiltersCount > 0 ? "No searches match your filters" : "No saved searches yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeFiltersCount > 0 
                ? "Try adjusting your filters to see more results"
                : "Save your searches from the main page to quickly access them later"}
            </p>
            {activeFiltersCount > 0 ? (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => navigate('/')}>
                Go to Search
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSearches.map((search) => (
              <div key={search.id} className="space-y-4">
                <Card 
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSearchClick(search)}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{search.name}</h3>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSearchClick(search);
                        }}
                      >
                        View {search.lead_count} leads
                      </Badge>
                    </div>
                    
                    {/* Search Criteria Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {search.niche}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {search.city} ({search.radius} mi)
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(search.created_at), 'MMM d, yyyy')}
                      </Badge>
                      {search.is_scheduled && (
                        <Badge variant="default" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleRunSearch(search)}
                    >
                      <Play className="h-4 w-4" />
                      Run Again
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
                
                <ScheduledSearchManager
                  searchId={search.id}
                  searchName={search.name}
                  isScheduled={search.is_scheduled}
                  scheduleFrequency={search.schedule_frequency}
                  scheduleTime={search.schedule_time}
                  isActive={search.is_active}
                  nextRunAt={search.next_run_at}
                  lastRunAt={search.last_run_at}
                  onUpdate={fetchSavedSearches}
                />
              </div>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="results">
            <ScheduledSearchResults />
          </TabsContent>
        </Tabs>

        {/* Search Details Dialog */}
        <Dialog open={!!selectedSearch} onOpenChange={() => setSelectedSearch(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5" />
                {selectedSearch?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedSearch && (
              <div className="space-y-6">
                {/* Search Criteria */}
                <div>
                  <h4 className="font-semibold mb-3">Search Criteria</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {selectedSearch.niche}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedSearch.city}
                    </Badge>
                    <Badge variant="outline">
                      Radius: {selectedSearch.radius} miles
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedSearch.created_at), 'MMM d, yyyy h:mm a')}
                    </Badge>
                  </div>
                </div>

                {/* Leads */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Found Leads ({searchLeads.length})
                  </h4>
                  
                  {isLoadingSearchLeads ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-4 animate-pulse">
                          <div className="h-5 bg-muted rounded mb-3" />
                          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </Card>
                      ))}
                    </div>
                  ) : searchLeads.length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">
                        No leads found for this search
                      </p>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 max-h-[400px] overflow-y-auto pr-2">
                      {searchLeads.map((lead) => (
                        <Card key={lead.id} className="p-4">
                          <h5 className="font-semibold mb-2 truncate">
                            {lead.business_name}
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{lead.niche}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {lead.city}
                                {lead.state ? `, ${lead.state}` : ''}
                              </span>
                            </div>
                            {lead.rating && (
                              <div className="flex items-center gap-1 text-xs">
                                ⭐ {lead.rating}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="text-xs text-muted-foreground truncate">
                                📞 {lead.phone}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default History;
