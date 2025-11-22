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

const History = () => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedSearches();
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

        <Tabs defaultValue="searches" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="searches">Saved Searches</TabsTrigger>
            <TabsTrigger value="results">Automated Results</TabsTrigger>
          </TabsList>

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
