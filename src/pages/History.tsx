import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, Play, Trash2, MapPin, Building2, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
        ) : searches.length === 0 ? (
          <Card className="p-12 text-center">
            <HistoryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground mb-6">
              Save your searches from the main page to quickly access them later
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Search
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {searches.map((search) => (
              <div key={search.id} className="space-y-4">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{search.name}</h3>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{search.niche}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{search.city} ({search.radius} miles)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">
                      {search.lead_count} leads
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                    </span>
                    {search.is_scheduled && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4">
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
      </div>
    </DashboardLayout>
  );
};

export default History;
