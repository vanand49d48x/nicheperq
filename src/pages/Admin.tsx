import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, TrendingUp, Calendar, Settings2 } from "lucide-react";

type AppRole = 'admin' | 'advanced' | 'standard' | 'basic' | 'pro' | 'free';

interface UserManagementDialogProps {
  user: UserData;
  onFeatureToggle: (userId: string, feature: 'crm' | 'ai', value: boolean) => void;
  onCustomLimitUpdate: (userId: string, limit: number | null) => void;
}

function UserManagementDialog({ user, onFeatureToggle, onCustomLimitUpdate }: UserManagementDialogProps) {
  const [customLimit, setCustomLimit] = useState<string>(user.custom_lead_limit?.toString() || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveLimit = () => {
    const limit = customLimit === '' ? null : parseInt(customLimit);
    if (limit !== null && (isNaN(limit) || limit < 0)) {
      toast.error("Please enter a valid number");
      return;
    }
    onCustomLimitUpdate(user.id, limit);
    setIsOpen(false);
  };

  const getRoleDefault = (role: AppRole) => {
    switch(role) {
      case 'admin': return 'Unlimited';
      case 'pro': return '5,000';
      case 'advanced': return '2,500';
      case 'standard': return '500';
      case 'free': return '50';
      default: return '50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Features</DialogTitle>
          <DialogDescription>
            Configure feature access and limits for {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="crm-access" className="text-base">CRM Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow access to CRM features
                </p>
              </div>
              <Switch
                id="crm-access"
                checked={user.has_crm_access}
                onCheckedChange={(checked) => onFeatureToggle(user.id, 'crm', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ai-access" className="text-base">AI Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow access to AI features
                </p>
              </div>
              <Switch
                id="ai-access"
                checked={user.has_ai_access}
                onCheckedChange={(checked) => onFeatureToggle(user.id, 'ai', checked)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lead-limit">Custom Monthly Lead Limit</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Default for {user.role.toUpperCase()}: {getRoleDefault(user.role)} leads/month
            </div>
            <div className="flex gap-2">
              <Input
                id="lead-limit"
                type="number"
                placeholder="Leave empty for role default"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                min="0"
              />
              <Button onClick={handleSaveLimit}>Save</Button>
            </div>
            {user.custom_lead_limit && (
              <p className="text-sm text-muted-foreground">
                Current custom limit: <span className="font-medium">{user.custom_lead_limit}</span> leads/month
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  company: string;
  role: AppRole;
  has_crm_access: boolean;
  has_ai_access: boolean;
  custom_lead_limit: number | null;
  total_leads: number;
  monthly_leads: number;
  last_search_date: string | null;
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
    
    if (roleData !== 'admin') {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, company");

    if (profilesError) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role, has_crm_access, has_ai_access, custom_lead_limit");

    if (rolesError) {
      toast.error("Failed to load user roles");
      setLoading(false);
      return;
    }

    // Get usage stats for each user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: stats } = await supabase.rpc('get_user_usage_stats', { 
          p_user_id: profile.id 
        });

        const userRole = roles?.find(r => r.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name || '',
          company: profile.company || '',
          role: userRole?.role || 'free',
          has_crm_access: userRole?.has_crm_access || false,
          has_ai_access: userRole?.has_ai_access || false,
          custom_lead_limit: userRole?.custom_lead_limit || null,
          total_leads: stats?.[0]?.total_leads || 0,
          monthly_leads: stats?.[0]?.monthly_leads || 0,
          last_search_date: stats?.[0]?.last_search_date || null,
        };
      })
    );

    setUsers(usersWithStats);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update user role");
    } else {
      toast.success("User role updated successfully");
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleFeatureToggle = async (userId: string, feature: 'crm' | 'ai', value: boolean) => {
    const field = feature === 'crm' ? 'has_crm_access' : 'has_ai_access';
    const { error } = await supabase
      .from("user_roles")
      .update({ [field]: value })
      .eq("user_id", userId);

    if (error) {
      toast.error(`Failed to update ${feature.toUpperCase()} access`);
    } else {
      toast.success(`${feature.toUpperCase()} access updated`);
      setUsers(users.map(u => u.id === userId ? { 
        ...u, 
        [feature === 'crm' ? 'has_crm_access' : 'has_ai_access']: value 
      } : u));
    }
  };

  const handleCustomLimitUpdate = async (userId: string, limit: number | null) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ custom_lead_limit: limit })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update lead limit");
    } else {
      toast.success("Lead limit updated");
      setUsers(users.map(u => u.id === userId ? { ...u, custom_lead_limit: limit } : u));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isAdmin) {
    return null;
  }

  const totalUsers = users.length;
  const totalLeadsGenerated = users.reduce((sum, u) => sum + u.total_leads, 0);
  const activeUsers = users.filter(u => u.last_search_date).length;

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8 px-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage users, monitor usage, and control access</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeadsGenerated}</div>
              <p className="text-xs text-muted-foreground">All-time generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Have searched at least once</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || 'No name'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.company || '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                  {user.role.toUpperCase()}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">FREE</SelectItem>
                              <SelectItem value="standard">STANDARD</SelectItem>
                              <SelectItem value="advanced">ADVANCED</SelectItem>
                              <SelectItem value="pro">PRO</SelectItem>
                              <SelectItem value="admin">ADMIN</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">{user.monthly_leads}</TableCell>
                        <TableCell className="text-right">{user.total_leads}</TableCell>
                        <TableCell>{formatDate(user.last_search_date)}</TableCell>
                        <TableCell className="text-center">
                          <UserManagementDialog
                            user={user}
                            onFeatureToggle={handleFeatureToggle}
                            onCustomLimitUpdate={handleCustomLimitUpdate}
                          />
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
    </DashboardLayout>
  );
}
