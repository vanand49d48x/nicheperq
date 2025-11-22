import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, Filter } from "lucide-react";
import { formatDistanceToNow, format, startOfDay, endOfDay } from "date-fns";

interface SearchRun {
  id: string;
  search_id: string;
  leads_found: number;
  status: string;
  error_message: string | null;
  executed_at: string;
  created_at: string;
}

interface SavedSearch {
  id: string;
  name: string;
  niche: string;
  city: string;
}

export const ScheduledSearchResults = ({ searchId }: { searchId?: string }) => {
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [searches, setSearches] = useState<Record<string, SavedSearch>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSearchRuns();
  }, [searchId, startDate, endDate]);

  const fetchSearchRuns = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('scheduled_search_runs')
        .select('*')
        .order('executed_at', { ascending: false });

      if (searchId) {
        query = query.eq('search_id', searchId);
      }

      if (startDate) {
        query = query.gte('executed_at', startOfDay(new Date(startDate)).toISOString());
      }

      if (endDate) {
        query = query.lte('executed_at', endOfDay(new Date(endDate)).toISOString());
      }

      const { data: runsData, error: runsError } = await query;

      if (runsError) throw runsError;

      // Fetch search details for all runs
      const searchIds = [...new Set(runsData?.map(r => r.search_id) || [])];
      const { data: searchesData, error: searchesError } = await supabase
        .from('saved_searches')
        .select('id, name, niche, city')
        .in('id', searchIds);

      if (searchesError) throw searchesError;

      const searchesMap: Record<string, SavedSearch> = {};
      searchesData?.forEach(s => {
        searchesMap[s.id] = s;
      });

      setSearches(searchesMap);
      setRuns(runsData || []);
    } catch (error) {
      console.error('Error fetching search runs:', error);
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalLeads = runs.reduce((sum, run) => sum + run.leads_found, 0);
  const successRate = runs.length > 0 
    ? ((runs.filter(r => r.status === 'success').length / runs.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Scheduled Search History</h3>
              <p className="text-sm text-muted-foreground">
                View results from automated search runs
              </p>
            </div>
          </div>
          <Filter className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{runs.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {startDate || endDate ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear Filters
          </Button>
        ) : null}
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-6 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : runs.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-semibold mb-1">No scheduled runs yet</h4>
          <p className="text-sm text-muted-foreground">
            Enable scheduling on your saved searches to see automated results here
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const search = searches[run.search_id];
            return (
              <Card key={run.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(run.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(run.executed_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {search && (
                      <div className="mb-2">
                        <h4 className="font-semibold">{search.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {search.niche} in {search.city}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Leads found: <strong className="text-foreground">{run.leads_found}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(run.executed_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>

                    {run.error_message && (
                      <div className="mt-2 flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>{run.error_message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};