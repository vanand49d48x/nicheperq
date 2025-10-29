import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NicheSelector } from "@/components/NicheSelector";
import { LocationInput } from "@/components/LocationInput";
import { LeadsTable } from "@/components/LeadsTable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Zap } from "lucide-react";

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
}

const Index = () => {
  const [niche, setNiche] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState("25");
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const { toast } = useToast();

  const handleFetchLeads = async () => {
    if (!niche || !city) {
      toast({
        title: "Missing Information",
        description: "Please select a niche and enter a city or zipcode.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Calling scrape-leads function with:', { niche, city, radius });
      
      // Call the edge function to scrape real leads
      const { data, error } = await supabase.functions.invoke('scrape-leads', {
        body: { niche, city, radius },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('API error:', data.error, data.details);
        throw new Error(data.error);
      }

      console.log('Received leads:', data);
      setLeads(data.leads || []);
      
      toast({
        title: "Leads Fetched Successfully",
        description: `Found ${data.count || 0} leads for ${niche} in ${city}`,
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

      setLeads(leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)));
      
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Lead Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Find high-quality business leads in any niche and location
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <NicheSelector value={niche} onChange={setNiche} />
            <LocationInput
              city={city}
              onCityChange={setCity}
              radius={radius}
              onRadiusChange={setRadius}
            />
          </div>
          
          <Button
            onClick={handleFetchLeads}
            disabled={isLoading}
            className="w-full gap-2"
            size="lg"
          >
            <Search className="h-5 w-5" />
            {isLoading ? "Fetching Leads..." : "Fetch Leads"}
          </Button>
        </Card>

        {/* Results Table */}
        {leads.length > 0 && (
          <LeadsTable leads={leads} onUpdateLead={handleUpdateLead} />
        )}
      </div>
    </div>
  );
};

export default Index;
