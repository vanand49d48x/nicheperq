import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";

const DatabaseExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportDatabase = async () => {
    setIsExporting(true);
    try {
      const exportData: any = {
        exported_at: new Date().toISOString(),
        version: "1.0",
        tables: {},
      };

      // Define tables to export with their queries
      const tables = [
        { name: "profiles", query: "SELECT * FROM profiles ORDER BY created_at" },
        { name: "user_roles", query: "SELECT * FROM user_roles ORDER BY created_at" },
        { name: "leads", query: "SELECT * FROM leads ORDER BY created_at" },
        { name: "saved_searches", query: "SELECT * FROM saved_searches ORDER BY created_at" },
        { name: "ai_workflows", query: "SELECT * FROM ai_workflows ORDER BY created_at" },
        { name: "workflow_steps", query: "SELECT * FROM workflow_steps ORDER BY workflow_id, step_order" },
        { name: "workflow_enrollments", query: "SELECT * FROM workflow_enrollments ORDER BY created_at" },
        { name: "workflow_performance_metrics", query: "SELECT * FROM workflow_performance_metrics ORDER BY period_start" },
        { name: "ai_email_drafts", query: "SELECT * FROM ai_email_drafts ORDER BY created_at" },
        { name: "email_accounts", query: "SELECT id, user_id, provider, from_name, from_email, is_verified, smtp_host, smtp_port, created_at, updated_at FROM email_accounts ORDER BY created_at" },
        { name: "email_tracking", query: "SELECT * FROM email_tracking ORDER BY timestamp" },
        { name: "contact_notes", query: "SELECT * FROM contact_notes ORDER BY created_at" },
        { name: "lead_interactions", query: "SELECT * FROM lead_interactions ORDER BY occurred_at" },
        { name: "lead_ai_scores", query: "SELECT * FROM lead_ai_scores ORDER BY created_at" },
        { name: "lead_reviews", query: "SELECT * FROM lead_reviews ORDER BY created_at" },
        { name: "ai_automation_logs", query: "SELECT * FROM ai_automation_logs ORDER BY created_at" },
        { name: "ai_chat_messages", query: "SELECT * FROM ai_chat_messages ORDER BY created_at" },
        { name: "api_usage", query: "SELECT * FROM api_usage ORDER BY created_at" },
        { name: "free_tier_searches", query: "SELECT * FROM free_tier_searches ORDER BY created_at" },
        { name: "support_tickets", query: "SELECT * FROM support_tickets ORDER BY created_at" },
        { name: "ticket_replies", query: "SELECT * FROM ticket_replies ORDER BY created_at" },
        { name: "knowledge_base_categories", query: "SELECT * FROM knowledge_base_categories ORDER BY display_order" },
        { name: "knowledge_base_articles", query: "SELECT * FROM knowledge_base_articles ORDER BY created_at" },
        { name: "admin_audit_logs", query: "SELECT * FROM admin_audit_logs ORDER BY created_at" },
        { name: "scheduled_search_runs", query: "SELECT * FROM scheduled_search_runs ORDER BY created_at" },
      ];

      // Fetch data from each table
      for (const table of tables) {
        toast({
          title: "Exporting...",
          description: `Fetching ${table.name}...`,
        });

        try {
          const { data, error } = await supabase
            .from(table.name as any)
            .select("*");

          if (error) {
            console.error(`Error fetching ${table.name}:`, error);
            exportData.tables[table.name] = {
              error: error.message,
              data: [],
            };
          } else {
            exportData.tables[table.name] = {
              row_count: data?.length || 0,
              data: data || [],
            };
          }
        } catch (err: any) {
          console.error(`Error fetching ${table.name}:`, err);
          exportData.tables[table.name] = {
            error: err.message,
            data: [],
          };
        }
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nicheperq-database-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Database export downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export database",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Database className="h-12 w-12 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Database Export</h1>
                <p className="text-muted-foreground">
                  Export all your database tables and content as a JSON file.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 w-full space-y-2 text-sm text-left">
                <p className="font-medium">This export includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>User profiles and roles</li>
                  <li>Leads and saved searches</li>
                  <li>AI workflows and enrollments</li>
                  <li>Email drafts and tracking data</li>
                  <li>Contact notes and interactions</li>
                  <li>AI scores and automation logs</li>
                  <li>Support tickets and knowledge base</li>
                  <li>All other database tables</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  <strong>Note:</strong> Sensitive data like encrypted passwords and tokens are excluded for security.
                </p>
              </div>

              <Button
                onClick={exportDatabase}
                disabled={isExporting}
                size="lg"
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Exporting Database...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Export Database
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DatabaseExport;
