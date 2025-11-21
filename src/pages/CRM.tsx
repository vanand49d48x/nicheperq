import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, List, Plus } from "lucide-react";
import { ContactCard } from "@/components/crm/ContactCard";
import { KanbanBoard } from "@/components/crm/KanbanBoard";

interface Lead {
  id: string;
  business_name: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  niche: string;
  city: string;
  address: string | null;
  contact_status: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  tags: string[];
}

const CRM = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const { toast } = useToast();

  const statusStats = {
    new: leads.filter(l => l.contact_status === 'new').length,
    attempted: leads.filter(l => l.contact_status === 'attempted').length,
    connected: leads.filter(l => l.contact_status === 'connected').length,
    in_conversation: leads.filter(l => l.contact_status === 'in_conversation').length,
    active_partner: leads.filter(l => l.contact_status === 'active_partner').length,
    do_not_contact: leads.filter(l => l.contact_status === 'do_not_contact').length,
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          contact_status: status,
          last_contacted_at: status !== 'new' ? new Date().toISOString() : null
        })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === leadId 
          ? { ...lead, contact_status: status, last_contacted_at: status !== 'new' ? new Date().toISOString() : lead.last_contacted_at }
          : lead
      ));

      toast({
        title: "Status Updated",
        description: "Contact status has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Contact Pipeline</h1>
              <p className="text-muted-foreground">Manage your referral partnerships</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                onClick={() => setView("kanban")}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">New</p>
              <p className="text-2xl font-bold">{statusStats.new}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Attempted</p>
              <p className="text-2xl font-bold">{statusStats.attempted}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Connected</p>
              <p className="text-2xl font-bold">{statusStats.connected}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">In Conversation</p>
              <p className="text-2xl font-bold">{statusStats.in_conversation}</p>
            </Card>
            <Card className="p-4 bg-gradient-primary text-primary-foreground">
              <p className="text-sm mb-1 opacity-90">Active Partners</p>
              <p className="text-2xl font-bold">{statusStats.active_partner}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Do Not Contact</p>
              <p className="text-2xl font-bold">{statusStats.do_not_contact}</p>
            </Card>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading contacts...</p>
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No contacts yet</p>
            <Button onClick={() => window.location.href = '/'}>
              <Plus className="h-4 w-4 mr-2" />
              Find Leads
            </Button>
          </Card>
        ) : view === "kanban" ? (
          <KanbanBoard 
            leads={leads} 
            onStatusChange={updateLeadStatus}
            onRefresh={fetchLeads}
          />
        ) : (
          <div className="grid gap-4">
            {leads.map(lead => (
              <ContactCard
                key={lead.id}
                lead={lead}
                onStatusChange={(status) => updateLeadStatus(lead.id, status)}
                onRefresh={fetchLeads}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CRM;
