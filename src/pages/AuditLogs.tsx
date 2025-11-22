import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action_type: string;
  action_details: any;
  created_at: string;
  admin_email?: string;
  target_email?: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const { data: logsData, error: logsError } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logsError) throw logsError;

      // Fetch admin and target user emails
      const adminIds = [...new Set(logsData?.map(log => log.admin_user_id) || [])];
      const targetIds = [...new Set(logsData?.map(log => log.target_user_id) || [])];
      const allUserIds = [...new Set([...adminIds, ...targetIds])];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", allUserIds);

      if (profilesError) throw profilesError;

      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      const enrichedLogs = logsData?.map(log => ({
        ...log,
        admin_email: emailMap.get(log.admin_user_id) || "Unknown",
        target_email: emailMap.get(log.target_user_id) || "Unknown",
      })) || [];

      setLogs(enrichedLogs);
    } catch (error: any) {
      console.error("Error loading audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const filteredLogs = getFilteredLogs();
    const csv = [
      ["Date", "Admin", "Target User", "Action Type", "Details"],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), "PPpp"),
        log.admin_email,
        log.target_email,
        log.action_type,
        JSON.stringify(log.action_details)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Audit logs exported successfully");
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === "" ||
        log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesActionType = actionTypeFilter === "all" || log.action_type === actionTypeFilter;

      const logDate = new Date(log.created_at);
      const matchesStartDate = !startDate || logDate >= new Date(startDate);
      const matchesEndDate = !endDate || logDate <= new Date(endDate);

      return matchesSearch && matchesActionType && matchesStartDate && matchesEndDate;
    });
  };

  const actionTypes = [...new Set(logs.map(log => log.action_type))];
  const filteredLogs = getFilteredLogs();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View and filter all administrative actions performed in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by email or action..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-type">Action Type</Label>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger id="action-type">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {actionTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </div>

            {/* Audit Logs Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Admin User</TableHead>
                    <TableHead>Target User</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No audit logs found</TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.created_at), "PPpp")}
                        </TableCell>
                        <TableCell>{log.admin_email}</TableCell>
                        <TableCell>{log.target_email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                            {log.action_type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.action_details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
