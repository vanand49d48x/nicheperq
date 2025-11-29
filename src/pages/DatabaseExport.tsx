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
      let sqlDump = `-- NichePerQ Database Export
-- Generated: ${new Date().toISOString()}
-- Note: This export includes table schemas and data from the public schema
-- For a complete dump including auth schema, use: supabase db dump

`;

      // Define tables to export
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

      // Fetch data from each table and generate SQL
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
            sqlDump += `-- Error fetching ${table.name}: ${error.message}\n\n`;
          } else if (data && data.length > 0) {
            sqlDump += `-- Table: ${table.name}\n`;
            sqlDump += `-- Rows: ${data.length}\n\n`;
            
            // Generate INSERT statements
            for (const row of data) {
              const columns = Object.keys(row);
              const values = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                return val;
              });
              
              sqlDump += `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            sqlDump += '\n';
          }
        } catch (err: any) {
          console.error(`Error fetching ${table.name}:`, err);
          sqlDump += `-- Error fetching ${table.name}: ${err.message}\n\n`;
        }
      }

      // Create downloadable SQL file
      const blob = new Blob([sqlDump], {
        type: "application/sql",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nicheperq-database-dump-${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "SQL dump downloaded successfully.",
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
                  Export all your database tables and data as a SQL dump file.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 w-full space-y-2 text-sm text-left">
                <p className="font-medium">This SQL dump includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>INSERT statements for all table data</li>
                  <li>User profiles, roles, and permissions</li>
                  <li>Leads, searches, and CRM data</li>
                  <li>AI workflows and automation logs</li>
                  <li>Email templates and tracking</li>
                  <li>Support tickets and knowledge base</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4">
                  <strong>Note:</strong> For schema DDL, functions, triggers, and auth tables, use Supabase CLI: <code className="bg-background px-1 rounded">supabase db dump</code>
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
                    Download SQL Dump
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
