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
      // For demo purposes, create sample leads
      // In production, this would call Outscraper/Apify API
      const sampleLeads = Array.from({ length: 10 }, (_, i) => ({
        niche,
        business_name: `${niche} Business ${i + 1}`,
        address: `${100 + i} Main Street`,
        city,
        state: "GA",
        zipcode: "30009",
        phone: `(555) ${String(100 + i).padStart(3, "0")}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        website: `https://example${i + 1}.com`,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        review_count: Math.floor(Math.random() * 200) + 10,
      }));

      // Insert into database
      const { data, error } = await supabase
        .from("leads")
        .insert(sampleLeads)
        .select();

      if (error) throw error;

      setLeads(data || []);
      
      toast({
        title: "Leads Fetched Successfully",
        description: `Found ${data?.length || 0} leads for ${niche} in ${city}`,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
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
