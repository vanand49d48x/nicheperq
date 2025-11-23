import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface TicketNotificationRequest {
  type: 'new_ticket' | 'admin_reply' | 'status_change';
  ticket: {
    id: string;
    subject: string;
    description?: string;
    status?: string;
    priority?: string;
    category?: string;
  };
  user: {
    email: string;
    name: string;
  };
  reply?: {
    message: string;
    admin_name: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, ticket, user, reply }: TicketNotificationRequest = await req.json();

    let emailTo: string;
    let emailSubject: string;
    let emailHtml: string;

    if (type === 'new_ticket') {
      // Send to support@nicheperq.com when new ticket is created
      emailTo = "support@nicheperq.com";
      emailSubject = `New Support Ticket #${ticket.id.slice(0, 8)} - ${ticket.subject}`;
      emailHtml = `
        <h2>New Support Ticket Received</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority || 'medium')}">${ticket.priority?.toUpperCase()}</span></p>
          <p><strong>Category:</strong> ${ticket.category || 'General'}</p>
          <p><strong>From:</strong> ${user.name} (${user.email})</p>
        </div>
        <h3>Description:</h3>
        <p style="white-space: pre-wrap;">${ticket.description}</p>
        <p style="margin-top: 30px;">
          <a href="${Deno.env.get("SUPABASE_URL")}/admin" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">
            View in Admin Dashboard
          </a>
        </p>
      `;
    } else if (type === 'admin_reply') {
      // Send to user when admin replies
      emailTo = user.email;
      emailSubject = `Re: Support Ticket #${ticket.id.slice(0, 8)} - ${ticket.subject}`;
      emailHtml = `
        <h2>New Reply to Your Support Ticket</h2>
        <p>Hi ${user.name},</p>
        <p>${reply?.admin_name || 'Our support team'} has replied to your support ticket:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket:</strong> ${ticket.subject}</p>
          <p><strong>Status:</strong> ${ticket.status?.toUpperCase()}</p>
        </div>
        <h3>Reply:</h3>
        <p style="white-space: pre-wrap; background: white; padding: 15px; border-left: 4px solid #0066cc;">${reply?.message}</p>
        <p style="margin-top: 30px;">
          <a href="${Deno.env.get("SUPABASE_URL")}/support" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">
            View Ticket & Reply
          </a>
        </p>
        <p style="margin-top: 20px; color: #666;">
          Best regards,<br>
          NichePerQ Support Team
        </p>
      `;
    } else {
      // Send to user when status changes
      emailTo = user.email;
      emailSubject = `Support Ticket Status Updated - #${ticket.id.slice(0, 8)}`;
      emailHtml = `
        <h2>Your Support Ticket Status Has Been Updated</h2>
        <p>Hi ${user.name},</p>
        <p>Your support ticket status has been updated:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket:</strong> ${ticket.subject}</p>
          <p><strong>New Status:</strong> <span style="color: ${getStatusColor(ticket.status || 'open')}">${ticket.status?.toUpperCase()}</span></p>
        </div>
        <p style="margin-top: 30px;">
          <a href="${Deno.env.get("SUPABASE_URL")}/support" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px;">
            View Ticket Details
          </a>
        </p>
        <p style="margin-top: 20px; color: #666;">
          Best regards,<br>
          NichePerQ Support Team
        </p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "NichePerQ Support <support@nicheperq.com>",
      to: [emailTo],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("Ticket notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending ticket notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getPriorityColor(priority: string): string {
  switch(priority) {
    case 'urgent': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#ca8a04';
    case 'low': return '#16a34a';
    default: return '#6b7280';
  }
}

function getStatusColor(status: string): string {
  switch(status) {
    case 'open': return '#2563eb';
    case 'in_progress': return '#ca8a04';
    case 'resolved': return '#16a34a';
    case 'closed': return '#6b7280';
    default: return '#6b7280';
  }
}
