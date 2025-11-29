import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Database, Code, RefreshCw } from "lucide-react";

interface SystemLog {
  id: string;
  timestamp: string;
  type: 'edge_function' | 'database' | 'auth';
  level: 'info' | 'warn' | 'error' | 'log';
  function_name?: string;
  event_message: string;
  user_id?: string;
  user_email?: string;
  error_severity?: string;
}

export function SystemHealthTab() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-system-logs');
      
      if (error) {
        throw error;
      }

      if (data?.logs) {
        const formattedLogs = data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp / 1000).toISOString(),
        }));
        setLogs(formattedLogs);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      console.error("Error loading system logs:", error);
      toast.error("Failed to load system health logs");
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    const matchesSearch = 
      log.event_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.function_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesLevel && matchesSearch;
  });

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warningCount = logs.filter(l => l.level === 'warn').length;
  const dbErrorCount = logs.filter(l => l.type === 'database' && l.level === 'error').length;
  const authErrorCount = logs.filter(l => l.type === 'auth' && l.level === 'error').length;

  const getLevelBadge = (level: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      error: "destructive",
      warn: "secondary",
      info: "outline",
      log: "outline",
    };
    return <Badge variant={variants[level] || "default"}>{level.toUpperCase()}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'edge_function':
        return <Code className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">DB Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbErrorCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authErrorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* System Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Health Logs</CardTitle>
              <CardDescription>Monitor edge functions, database, and API errors</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="edge_function">Edge Functions</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="auth">Auth/API</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No logs found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Timestamp</TableHead>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.type)}
                          <span className="text-xs capitalize">{log.type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      <TableCell className="text-sm">
                        {log.user_email ? (
                          <div className="truncate max-w-[150px]" title={log.user_email}>
                            {log.user_email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-sm" title={log.event_message}>
                          {log.function_name && (
                            <span className="font-medium">{log.function_name}: </span>
                          )}
                          {log.event_message}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
