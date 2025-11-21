import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NicheSelector } from "@/components/NicheSelector";
import { LocationInput } from "@/components/LocationInput";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadsMap } from "@/components/LeadsMap";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Map, List, Save } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UsageIndicator } from "@/components/UsageIndicator";

interface Lead {
  id: string;
  niche: string;
  business_name: string;
  address: string | null;
  city: string;
  state: string | null;
  zipcode: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
}

const ITEMS_PER_PAGE = 25;

const Index = () => {
  const [niche, setNiche] = useState("");
  const [customCriteria, setCustomCriteria] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("25");
  const [isLoading, setIsLoading] = useState(false);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [filterByBounds, setFilterByBounds] = useState(false);
  const [bounds, setBounds] = useState<{ n: number; s: number; e: number; w: number } | null>(null);
  const [hoveredLeadId, setHoveredLeadId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem('mapbox_public_token');
    if (stored) setMapboxToken(stored);

    // Check if we're coming from History page with search params
    if (location.state) {
      const { niche: stateNiche, city: stateCity, radius: stateRadius } = location.state as any;
      if (stateNiche) setNiche(stateNiche);
      if (stateCity) setCity(stateCity);
      if (stateRadius) setRadius(stateRadius);
    }
  }, [location]);

  const displayedLeads = filterByBounds && bounds
    ? allLeads.filter((l) => {
        const lat = Number(l.latitude);
        const lng = Number(l.longitude);
        if (!isFinite(lat) || !isFinite(lng)) return false;
        return lat <= bounds.n && lat >= bounds.s && lng <= bounds.e && lng >= bounds.w;
      })
    : allLeads;

  const totalPages = Math.ceil(displayedLeads.length / ITEMS_PER_PAGE) || 1;
  const paginatedLeads = displayedLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFetchLeads = async () => {
    const searchCriteria = customCriteria.trim() || niche;
    
    if (!searchCriteria || !city) {
      toast({
        title: "Missing Information",
        description: "Please select a niche or enter custom search criteria, and enter a city or zipcode.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to fetch leads.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('Calling scrape-leads function with:', { niche: searchCriteria, city, radius });
      
      // Call the edge function to scrape real leads
      const { data, error } = await supabase.functions.invoke('scrape-leads', {
        body: { niche: searchCriteria, city, radius },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('API error:', data.error, data.details);
        
        // Handle rate limit errors specially
        if (data.error === 'Monthly limit reached' || data.error === 'Would exceed monthly limit') {
          toast({
            title: "Usage Limit Reached",
            description: data.details || "You've reached your monthly limit. Upgrade your plan for more leads.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        throw new Error(data.error);
      }

      console.log('Received leads:', data);
      setAllLeads(data.leads || []);
      setCurrentPage(1);
      
      toast({
        title: "Leads Fetched Successfully",
        description: `Found ${data.count || 0} leads for ${searchCriteria} in ${city}`,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setAllLeads(allLeads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)));
      
      toast({
        title: "Lead Updated",
        description: "Lead information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this search",
        variant: "destructive",
      });
      return;
    }

    const searchCriteria = customCriteria.trim() || niche;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save searches",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user.id,
          name: searchName,
          niche: searchCriteria,
          city,
          radius,
          lead_count: allLeads.length,
          last_run_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Search Saved",
        description: "You can find this search in your history",
      });
      setShowSaveDialog(false);
      setSearchName("");
    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-7xl animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Leads</h1>
          <p className="text-muted-foreground">
            Search for high-quality business leads in any niche and location
          </p>
        </div>

        {/* Usage Indicator */}
        <div className="mb-6">
          <UsageIndicator />
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-8 shadow-lg border-border/50">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <NicheSelector value={niche} onChange={setNiche} />
              <div className="space-y-2">
                <label htmlFor="custom-criteria" className="text-sm font-medium text-foreground">
                  Or Enter Custom Search Criteria
                </label>
                <Textarea
                  id="custom-criteria"
                  placeholder="e.g., Organic restaurants with outdoor seating..."
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your own search terms instead of selecting a predefined niche
                </p>
              </div>
            </div>
            <LocationInput
              city={city}
              onCityChange={setCity}
              radius={radius}
              onRadiusChange={setRadius}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleFetchLeads}
              disabled={isLoading}
              className="flex-1 gap-2"
              size="lg"
            >
              <Search className="h-5 w-5" />
              {isLoading ? "Fetching Leads..." : "Fetch Leads"}
            </Button>
            {allLeads.length > 0 && (
              <Button
                onClick={() => setShowSaveDialog(true)}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Save className="h-5 w-5" />
                Save
              </Button>
            )}
          </div>
        </Card>

        {/* Results */}
        {allLeads.length > 0 && (
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="table" className="gap-2">
                <List className="h-4 w-4" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="h-4 w-4" />
                Map View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="mt-6">
              <LeadsTable 
                leads={paginatedLeads} 
                onUpdateLead={handleUpdateLead}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <h2 className="text-xl font-semibold">Results ({displayedLeads.length})</h2>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex items-center gap-2">
                      <Switch id="filter-bounds" checked={filterByBounds} onCheckedChange={setFilterByBounds} />
                      <Label htmlFor="filter-bounds" className="text-sm">Filter by map view</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Mapbox token"
                        value={mapboxToken}
                        onChange={(e) => setMapboxToken(e.target.value)}
                        className="w-48"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          localStorage.setItem('mapbox_public_token', mapboxToken);
                          toast({ title: 'Token saved' });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[600px]">
                {/* Results sidebar */}
                <div className="w-80 flex-shrink-0 overflow-y-auto border rounded-lg bg-card">
                  <div className="p-4 space-y-3">
                    {paginatedLeads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        className={`p-4 transition-all cursor-pointer ${
                          hoveredLeadId === lead.id 
                            ? 'shadow-lg border-primary ring-2 ring-primary' 
                            : 'hover:shadow-md'
                        }`}
                        onMouseEnter={() => setHoveredLeadId(lead.id)}
                        onMouseLeave={() => setHoveredLeadId(null)}
                      >
                        <h3 className="font-semibold text-sm mb-1">{lead.business_name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{lead.address}</p>
                        <div className="flex items-center gap-2 text-xs">
                          {lead.rating && (
                            <span className="flex items-center gap-1">
                              ⭐ {lead.rating}
                            </span>
                          )}
                          {lead.review_count && (
                            <span className="text-muted-foreground">({lead.review_count})</span>
                          )}
                        </div>
                        {lead.phone && (
                          <p className="text-xs mt-2 text-muted-foreground">{lead.phone}</p>
                        )}
                      </Card>
                    ))}
                    {paginatedLeads.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No results found</p>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Map */}
                <div className="flex-1 rounded-lg overflow-hidden border">
                  <LeadsMap 
                    leads={allLeads} 
                    mapboxToken={mapboxToken}
                    locationQuery={city}
                    hoveredLeadId={hoveredLeadId}
                    onLeadHover={setHoveredLeadId}
                    searchRadius={Number(radius)}
                    onBoundsChange={(b) => setBounds({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Save Search Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Search</DialogTitle>
              <DialogDescription>
                Give this search a name so you can easily find it later
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="e.g., NYC Dentists"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSearch}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Index;
