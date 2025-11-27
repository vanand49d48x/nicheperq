import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LayoutGrid, List, Plus, Sparkles, Zap, Bot } from "lucide-react";
import { ContactCard } from "@/components/crm/ContactCard";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { AIAutomationPanel } from "@/components/crm/AIAutomationPanel";
import { WorkflowBuilder } from "@/components/crm/WorkflowBuilder";
import VisualWorkflowBuilder from "@/components/crm/VisualWorkflowBuilder";
import WorkflowManager from "@/components/crm/WorkflowManager";
import { AIInsights } from "@/components/crm/AIInsights";
import { FeatureGate } from "@/components/FeatureGate";
import { AIChatbot } from "@/components/crm/AIChatbot";
import { EmailAccountBanner } from "@/components/crm/EmailAccountBanner";
import PipelineAnalytics from "@/components/crm/PipelineAnalytics";
import OrchestrationSettings from "@/components/crm/OrchestrationSettings";

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
  ai_quality_score: number | null;
  ai_intent_score: number | null;
  closing_probability: number | null;
  risk_score: number | null;
  sentiment: string | null;
  recommended_action: string | null;
  recommended_tone: string | null;
  last_ai_analysis_at: string | null;
}

const CRM = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"kanban" | "list" | "automation" | "workflows" | "insights" | "analytics" | "orchestration" | "visual-workflows" | "workflow-editor">(
    (searchParams.get('view') as any) || "kanban"
  );
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | undefined>();
  const [workflowRefreshTrigger, setWorkflowRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  
  // Cache AI tab data to prevent refetching on navigation
  const [automationData, setAutomationData] = useState<any>(null);
  const [workflowsData, setWorkflowsData] = useState<any>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    checkAiAccess();
    fetchLeads();
  }, []);

  // Prefetch AI data when switching to AI tabs
  useEffect(() => {
    if (hasAiAccess) {
      if (view === 'automation' && !automationData) {
        fetchAutomationData();
      }
      if ((view === 'workflows' || view === 'visual-workflows' || view === 'workflow-editor')) {
        fetchWorkflowsData();
      }
    }
  }, [view, hasAiAccess]);

  const checkAiAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('has_ai_access, role')
        .eq('user_id', user.id)
        .single();

      if (roleData) {
        setHasAiAccess(roleData.role === 'admin' || roleData.has_ai_access);
      }
    } catch (error) {
      console.error('Error checking AI access:', error);
    }
  };

  const fetchAutomationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: logsData }, ...statsResults] = await Promise.all([
        supabase.from('ai_automation_logs').select('*, leads(business_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('ai_automation_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'email_drafted').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ai_automation_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'email_sent').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ai_automation_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'status_changed').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('ai_automation_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('action_type', 'workflow_executed').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      setAutomationData({
        logs: logsData || [],
        stats: {
          emails_drafted: statsResults[0].count || 0,
          emails_sent: statsResults[1].count || 0,
          status_changes: statsResults[2].count || 0,
          workflows_executed: statsResults[3].count || 0
        }
      });
    } catch (error) {
      console.error('Error fetching automation data:', error);
    }
  };

  const fetchWorkflowsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setWorkflowsData(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }
  };

  // Update URL when view changes
  const updateView = (newView: typeof view) => {
    setView(newView);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('view', newView);
      return params;
    });
  };

  const statusStats = {
    new: leads.filter(l => l.contact_status === 'new').length,
    attempted: leads.filter(l => l.contact_status === 'attempted').length,
    connected: leads.filter(l => l.contact_status === 'connected').length,
    in_conversation: leads.filter(l => l.contact_status === 'in_conversation').length,
    active_partner: leads.filter(l => l.contact_status === 'active_partner').length,
    do_not_contact: leads.filter(l => l.contact_status === 'do_not_contact').length,
  };


  const highlightedLeadId = searchParams.get('lead');

  useEffect(() => {
    if (highlightedLeadId && leads.length > 0) {
      updateView("list");
      setTimeout(() => {
        const element = document.getElementById(`lead-${highlightedLeadId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedLeadId, leads]);

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

  const handleStatusCardClick = (status: string) => {
    updateView("kanban");
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
  };

  const updateLeadInPlace = (leadId: string, updates: any) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, ...updates }
        : lead
    ));
  };

  return (
    <DashboardLayout>
      <FeatureGate feature="crm">
        <div className="container mx-auto py-8 px-6 max-w-7xl">
        {/* Email Account Banner */}
        <EmailAccountBanner />
        
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
                onClick={() => updateView("kanban")}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={view === "list" ? "default" : "outline"}
                onClick={() => updateView("list")}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              {hasAiAccess && (
                <>
                  <Button
                    variant={view === "automation" ? "default" : "outline"}
                    onClick={() => updateView("automation")}
                    className="gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    AI Activity
                  </Button>
                  <Button
                    variant={view === "workflows" ? "default" : "outline"}
                    onClick={() => updateView("workflows")}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Workflows
                  </Button>
                  <Button
                    variant={view === "insights" ? "default" : "outline"}
                    onClick={() => updateView("insights")}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Insights
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'new' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusCardClick('new')}
            >
              <p className="text-sm text-muted-foreground mb-1">New</p>
              <p className="text-2xl font-bold">{statusStats.new}</p>
            </Card>
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'attempted' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusCardClick('attempted')}
            >
              <p className="text-sm text-muted-foreground mb-1">Attempted</p>
              <p className="text-2xl font-bold">{statusStats.attempted}</p>
            </Card>
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'connected' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusCardClick('connected')}
            >
              <p className="text-sm text-muted-foreground mb-1">Connected</p>
              <p className="text-2xl font-bold">{statusStats.connected}</p>
            </Card>
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'in_conversation' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusCardClick('in_conversation')}
            >
              <p className="text-sm text-muted-foreground mb-1">In Conversation</p>
              <p className="text-2xl font-bold">{statusStats.in_conversation}</p>
            </Card>
            <Card 
              className={`p-4 bg-gradient-primary text-primary-foreground cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'active_partner' ? 'ring-2 ring-accent ring-offset-2' : ''
              }`}
              onClick={() => handleStatusCardClick('active_partner')}
            >
              <p className="text-sm mb-1 opacity-90">Active Partners</p>
              <p className="text-2xl font-bold">{statusStats.active_partner}</p>
            </Card>
            <Card 
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                statusFilter === 'do_not_contact' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleStatusCardClick('do_not_contact')}
            >
              <p className="text-sm text-muted-foreground mb-1">Do Not Contact</p>
              <p className="text-2xl font-bold">{statusStats.do_not_contact}</p>
            </Card>
          </div>
          
          {/* Analytics/Insights Toggle */}
          {hasAiAccess && (view === "insights" || view === "analytics") && (
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                variant={view === "insights" ? "default" : "outline"}
                onClick={() => updateView("insights")}
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Quick Insights
              </Button>
              <Button
                variant={view === "analytics" ? "default" : "outline"}
                onClick={() => updateView("analytics")}
                size="sm"
              >
                📊 Full Analytics
              </Button>
            </div>
          )}
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
            onLeadUpdate={updateLeadInPlace}
            statusFilter={statusFilter}
            onClearFilter={() => setStatusFilter(null)}
          />
        ) : view === "automation" ? (
          <AIAutomationPanel />
        ) : view === "workflows" ? (
          <WorkflowManager
            onCreateNew={() => {
              setEditingWorkflowId(undefined);
              updateView('workflow-editor');
            }}
            onEditWorkflow={(id) => {
              setEditingWorkflowId(id);
              updateView('workflow-editor');
            }}
            refreshTrigger={workflowRefreshTrigger}
          />
        ) : view === "insights" ? (
          <AIInsights />
        ) : view === "analytics" ? (
          <PipelineAnalytics />
        ) : view === "orchestration" ? (
          <OrchestrationSettings />
        ) : view === "visual-workflows" ? (
          <WorkflowManager
            onCreateNew={() => {
              setEditingWorkflowId(undefined);
              updateView('workflow-editor');
            }}
            onEditWorkflow={(id) => {
              setEditingWorkflowId(id);
              updateView('workflow-editor');
            }}
            refreshTrigger={workflowRefreshTrigger}
          />
        ) : view === "workflow-editor" ? (
          <VisualWorkflowBuilder
            workflowId={editingWorkflowId}
            onBack={() => {
              setEditingWorkflowId(undefined);
              updateView('workflows');
            }}
            onSaved={() => {
              setWorkflowRefreshTrigger(prev => prev + 1);
              setEditingWorkflowId(undefined);
              updateView('workflows');
            }}
          />
        ) : (
          <div className="grid gap-4">
            {leads.map(lead => (
              <div key={lead.id} id={`lead-${lead.id}`}>
                <ContactCard
                  lead={lead}
                  onStatusChange={(status) => updateLeadStatus(lead.id, status)}
                  onRefresh={fetchLeads}
                  isHighlighted={highlightedLeadId === lead.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      </FeatureGate>
      
      {/* AI Chatbot Widget */}
      <FeatureGate feature="ai">
        <AIChatbot />
      </FeatureGate>
    </DashboardLayout>
  );
};

export default CRM;
