import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Database, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DatabaseCLIGuide = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Database Backup Options</h1>
              <p className="text-muted-foreground">
                Understanding backup methods for Lovable Cloud projects
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/database-export")}>
              <Download className="mr-2 h-4 w-4" />
              Quick Export
            </Button>
          </div>

          <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">You're on Lovable Cloud</h2>
                <p className="text-muted-foreground mb-4">
                  Lovable Cloud uses Supabase under the hood but is fully managed by Lovable. You don't have direct CLI access to the underlying Supabase project.
                </p>
                <div className="space-y-2">
                  <p className="font-medium">For Lovable Cloud users, use these export methods:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Quick Export</strong> (above) - exports all table data as SQL INSERT statements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Cloud Tab Export</strong> - navigate to Cloud → Database → Tables, select a table, and click export</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Migration Files</strong> - your schema changes are tracked in <code className="bg-background px-1 rounded">supabase/migrations/</code></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <Terminal className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Advanced: External Supabase Projects Only</h2>
                <p className="text-muted-foreground">
                  The information below applies only if you've connected an external Supabase project (not Lovable Cloud). The Supabase CLI provides a complete database dump that includes:
                </p>
              </div>
            </div>
            
            <ul className="space-y-2 ml-16">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete schema with CREATE TABLE statements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>All database functions, triggers, and stored procedures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Row-Level Security (RLS) policies and permissions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Indexes, constraints, and foreign key relationships</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Auth schema with users and authentication data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>All table data in PostgreSQL-compatible format</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              Install Supabase CLI
            </h2>
            
            <div className="space-y-4 ml-10">
              <div>
                <p className="text-sm font-medium mb-2">macOS / Linux:</p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  brew install supabase/tap/supabase
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Windows (PowerShell):</p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git<br/>
                  scoop install supabase
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">npm (cross-platform):</p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  npm install -g supabase
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm">
                  📚 Full installation guide: <a href="https://supabase.com/docs/guides/cli/getting-started" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">supabase.com/docs/guides/cli</a>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Authenticate with Supabase
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Log in to your Supabase account to access your project:
              </p>
              
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                supabase login
              </div>

              <p className="text-sm text-muted-foreground">
                This will open a browser window for authentication. After logging in, return to your terminal.
              </p>
            </div>
          </Card>

          <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white text-sm font-bold">3</span>
              Link to Your Project
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-amber-900 dark:text-amber-200 font-medium">
                ⚠️ This step does NOT work for Lovable Cloud projects
              </p>
              
              <p className="text-muted-foreground">
                For external Supabase projects only, connect using:
              </p>
              
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                supabase link --project-ref YOUR_PROJECT_REF
              </div>

              <p className="text-sm text-muted-foreground">
                Lovable Cloud projects are fully managed and don't support direct CLI access. Use the Quick Export feature instead.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
              Create Complete Database Dump
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                Generate a complete SQL dump of your database:
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Full dump (schema + data):</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    supabase db dump -f nicheperq-full-backup.sql
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Schema only (no data):</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    supabase db dump --schema-only -f nicheperq-schema.sql
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Data only (no schema):</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    supabase db dump --data-only -f nicheperq-data.sql
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Include specific roles:</p>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                    supabase db dump --role-only -f nicheperq-roles.sql
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">✅ What's included in the full dump:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• All tables with CREATE TABLE statements</li>
                  <li>• All data as INSERT statements</li>
                  <li>• Database functions and triggers</li>
                  <li>• RLS policies and security definer functions</li>
                  <li>• Indexes, constraints, and foreign keys</li>
                  <li>• Extensions (uuid-ossp, pg_cron, etc.)</li>
                  <li>• Views and materialized views</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">5</span>
              Restore from Backup
            </h2>
            
            <div className="space-y-4 ml-10">
              <p className="text-muted-foreground">
                To restore your database from a backup file:
              </p>
              
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                supabase db reset --db-url postgresql://[YOUR_CONNECTION_STRING]
              </div>

              <p className="text-sm text-muted-foreground">
                Or use psql directly:
              </p>

              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                psql -h db.nqfcdcfzxehpjhlmqudq.supabase.co -U postgres -d postgres -f nicheperq-full-backup.sql
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm">
                  ⚠️ <strong>Warning:</strong> Restoring will overwrite all existing data. Always test on a staging database first.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Best Practices
            </h2>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Schedule Regular Backups</p>
                  <p className="text-sm text-muted-foreground">Set up a cron job to run database dumps daily or weekly</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Store Securely</p>
                  <p className="text-sm text-muted-foreground">Keep backups in a secure location separate from your production server</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Test Restores</p>
                  <p className="text-sm text-muted-foreground">Periodically test your backup files to ensure they can be restored successfully</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Version Control</p>
                  <p className="text-sm text-muted-foreground">Keep multiple backup versions with timestamps in filenames</p>
                </div>
              </li>
            </ul>
          </Card>

          <div className="flex gap-4">
            <Button onClick={() => navigate("/database-export")} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Quick Data Export
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="https://supabase.com/docs/guides/cli/managing-config" target="_blank" rel="noopener noreferrer">
                CLI Documentation
              </a>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DatabaseCLIGuide;
