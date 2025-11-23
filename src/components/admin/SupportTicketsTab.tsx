import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send, Filter } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

interface UserProfile {
  email: string;
  full_name: string;
}

export function SupportTicketsTab() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketReplies, setTicketReplies] = useState<TicketReply[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [replyMessage, setReplyMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load support tickets");
    } else {
      setTickets(data || []);
      
      // Load user profiles
      const userIds = [...new Set((data || []).map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profilesMap: Record<string, UserProfile> = {};
      (profiles || []).forEach(p => {
        profilesMap[p.id] = { email: p.email || "", full_name: p.full_name || "" };
      });
      setUserProfiles(profilesMap);
    }
    setLoading(false);
  };

  const loadTicketReplies = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading replies:", error);
      toast.error("Failed to load replies");
    } else {
      setTicketReplies(data || []);
    }
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadTicketReplies(ticket.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("ticket_replies")
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: replyMessage,
          is_admin_reply: true,
        });

      if (error) throw error;

      const userProfile = userProfiles[selectedTicket.user_id];
      
      // Send email notification
      await supabase.functions.invoke("send-ticket-notification", {
        body: {
          type: "admin_reply",
          ticket: {
            id: selectedTicket.id,
            subject: selectedTicket.subject,
            status: selectedTicket.status,
          },
          user: {
            email: userProfile?.email || "",
            name: userProfile?.full_name || "User",
          },
          reply: {
            message: replyMessage,
            admin_name: "Support Team",
          },
        },
      });

      toast.success("Reply sent successfully");
      setReplyMessage("");
      await loadTicketReplies(selectedTicket.id);
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const resolvedAt = newStatus === 'resolved' ? new Date().toISOString() : null;
      
      const { error } = await supabase
        .from("support_tickets")
        .update({ 
          status: newStatus as Ticket['status'],
          resolved_at: resolvedAt,
        })
        .eq("id", ticketId);

      if (error) throw error;

      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const userProfile = userProfiles[ticket.user_id];
        
        // Send email notification
        await supabase.functions.invoke("send-ticket-notification", {
          body: {
            type: "status_change",
            ticket: {
              id: ticket.id,
              subject: ticket.subject,
              status: newStatus,
            },
            user: {
              email: userProfile?.email || "",
              name: userProfile?.full_name || "User",
            },
          },
        });
      }

      toast.success("Status updated successfully");
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as Ticket['status'], resolved_at: resolvedAt });
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleUpdatePriority = async (ticketId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ priority: newPriority as Ticket['priority'] })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Priority updated successfully");
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority as Ticket['priority'] });
      }
    } catch (error: any) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      in_progress: "secondary",
      resolved: "outline",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return (
      <Badge className={`${colors[priority]} text-white`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userProfiles[ticket.user_id]?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedToday = tickets.filter(t => {
    if (!t.resolved_at) return false;
    const today = new Date().toDateString();
    return new Date(t.resolved_at).toDateString() === today;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>View and manage all customer support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tickets found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {userProfiles[ticket.user_id]?.full_name || 'Unknown'}
                          </div>
                          <div className="text-muted-foreground">
                            {userProfiles[ticket.user_id]?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={(value) => handleUpdatePriority(selectedTicket.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Customer</Label>
                <div className="mt-1 text-sm">
                  <div className="font-medium">
                    {userProfiles[selectedTicket.user_id]?.full_name || 'Unknown User'}
                  </div>
                  <div className="text-muted-foreground">
                    {userProfiles[selectedTicket.user_id]?.email}
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <Label className="mb-2 block">Original Message:</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div className="space-y-3">
                <Label>Conversation:</Label>
                {ticketReplies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-3 rounded-lg ${
                      reply.is_admin_reply
                        ? "bg-primary/10 mr-4"
                        : "bg-muted ml-4"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">
                        {reply.is_admin_reply ? "Support Team" : "Customer"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-reply">Your Reply</Label>
                <Textarea
                  id="admin-reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={4}
                />
                <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply to Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
