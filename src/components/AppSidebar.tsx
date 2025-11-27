import { useState, useEffect } from "react";
import { Home, Settings, LogOut, Search, User, History, Shield, Receipt, Users, ScrollText, BarChart3, UserMinus, HelpCircle, BookOpen, Mail } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Find Leads", url: "/dashboard", icon: Search },
  { title: "CRM Pipeline", url: "/crm", icon: Users },
  { title: "History", url: "/history", icon: History },
];

const settingsItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Email Settings", url: "/email-settings", icon: Mail },
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Knowledge Base", url: "/kb", icon: BookOpen },
  { title: "Support", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>(() => {
    return sessionStorage.getItem('userEmail') || "";
  });
  const [userInitials, setUserInitials] = useState<string>(() => {
    return sessionStorage.getItem('userInitials') || "U";
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>(() => {
    // Load cached role from sessionStorage to prevent flicker
    return sessionStorage.getItem('userRole') || "free";
  });
  const [newLeadsCount, setNewLeadsCount] = useState<number>(0);
  const collapsed = state === "collapsed";

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const initials = user.email.charAt(0).toUpperCase();
        
        setUserEmail(user.email);
        setUserInitials(initials);
        
        // Cache email and initials to prevent flicker on navigation
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('userInitials', initials);
        
        // Check if user is admin and get role
        const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
        const role = roleData || 'free';
        setIsAdmin(roleData === 'admin');
        setUserRole(role);
        
        // Cache role in sessionStorage to prevent flicker on navigation
        sessionStorage.setItem('userRole', role);

        // Fetch count of new leads
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('contact_status', 'new');
        
        setNewLeadsCount(count || 0);
      }
    };
    loadUserData();

    // Set up realtime subscription for new leads
    const channel = supabase
      .channel('new-leads-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `contact_status=eq.new`,
        },
        () => {
          try {
            loadUserData();
          } catch (error) {
            console.error('Error in realtime leads callback:', error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime leads subscription active');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error('Error removing realtime channel:', error);
      }
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      navigate("/auth");
      toast.success("Signed out successfully");
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              L
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">NichePerQ</h2>
                <p className="text-xs text-muted-foreground">Niche Insights. Real Growth.</p>
              </div>
            )}
          </div>
          {!collapsed && <NotificationCenter />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-all duration-200"
                  >
                    <Link to={item.url} className="flex items-center gap-3 relative">
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === "CRM Pipeline" && newLeadsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                          {newLeadsCount > 99 ? '99+' : newLeadsCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-all duration-200"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin")}
                    className="transition-all duration-200"
                  >
                    <Link to="/admin" className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      {!collapsed && <span>Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/analytics")}
                    className="transition-all duration-200"
                  >
                    <Link to="/analytics" className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5" />
                      {!collapsed && <span>Analytics</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/churn-analytics")}
                    className="transition-all duration-200"
                  >
                    <Link to="/churn-analytics" className="flex items-center gap-3">
                      <UserMinus className="h-5 w-5" />
                      {!collapsed && <span>Churn Analysis</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/audit-logs")}
                    className="transition-all duration-200"
                  >
                    <Link to="/audit-logs" className="flex items-center gap-3">
                      <ScrollText className="h-5 w-5" />
                      {!collapsed && <span>Audit Logs</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Plan</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
