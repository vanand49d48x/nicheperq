import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  to_email: string;
  user_name: string;
  action_type: "role_change" | "feature_toggle" | "limit_change";
  action_details: {
    old_value?: string;
    new_value?: string;
    admin_email?: string;
    custom_message?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to_email, user_name, action_type, action_details }: NotificationRequest = await req.json();

    // Generate email content based on action type
    let subject = "";
    let htmlContent = "";

    switch (action_type) {
      case "role_change":
        subject = "Your Account Role Has Been Updated";
        htmlContent = `
          <h1>Hello ${user_name},</h1>
          <p>Your account role has been updated by an administrator.</p>
          <p><strong>Previous Role:</strong> ${action_details.old_value}</p>
          <p><strong>New Role:</strong> ${action_details.new_value}</p>
          ${action_details.custom_message ? `<p>${action_details.custom_message}</p>` : ""}
          <p>If you have any questions about this change, please contact support.</p>
          <p>Best regards,<br>NichePerQ Team</p>
        `;
        break;

      case "feature_toggle":
        subject = "Your Account Features Have Been Updated";
        htmlContent = `
          <h1>Hello ${user_name},</h1>
          <p>Your account features have been updated by an administrator.</p>
          <p><strong>Changes:</strong></p>
          <ul>
            ${action_details.old_value ? `<li>Previous: ${action_details.old_value}</li>` : ""}
            ${action_details.new_value ? `<li>Current: ${action_details.new_value}</li>` : ""}
          </ul>
          ${action_details.custom_message ? `<p>${action_details.custom_message}</p>` : ""}
          <p>If you have any questions about these changes, please contact support.</p>
          <p>Best regards,<br>NichePerQ Team</p>
        `;
        break;

      case "limit_change":
        subject = "Your Lead Limit Has Been Updated";
        htmlContent = `
          <h1>Hello ${user_name},</h1>
          <p>Your monthly lead limit has been adjusted by an administrator.</p>
          <p><strong>Previous Limit:</strong> ${action_details.old_value || "Default"}</p>
          <p><strong>New Limit:</strong> ${action_details.new_value}</p>
          ${action_details.custom_message ? `<p>${action_details.custom_message}</p>` : ""}
          <p>This change is effective immediately.</p>
          <p>Best regards,<br>NichePerQ Team</p>
        `;
        break;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "NichePerQ <onboarding@resend.dev>",
      to: [to_email],
      subject,
      html: htmlContent,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
