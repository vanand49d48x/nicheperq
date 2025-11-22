import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SubscriptionNotificationRequest {
  email: string;
  name?: string;
  event_type: "upgrade" | "downgrade" | "cancel";
  plan_name?: string;
  previous_plan?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, event_type, plan_name, previous_plan }: SubscriptionNotificationRequest = await req.json();

    let subject = "";
    let htmlContent = "";

    switch (event_type) {
      case "upgrade":
        subject = `Welcome to ${plan_name}!`;
        htmlContent = `
          <h1>Congratulations, ${name || "there"}!</h1>
          <p>You've successfully upgraded to the <strong>${plan_name}</strong> plan.</p>
          <h2>Your New Features:</h2>
          ${plan_name === "STANDARD" ? `
            <ul>
              <li>Unlimited niche searches</li>
              <li>Full lead details (phone + email)</li>
              <li>Filtering options</li>
              <li>CSV export</li>
              <li>500 leads/month</li>
            </ul>
          ` : plan_name === "ADVANCED" ? `
            <ul>
              <li>Everything in Standard, plus:</li>
              <li>CRM features with unlimited contacts</li>
              <li>Status stages and notes</li>
              <li>Kanban pipeline view</li>
              <li>2,500 leads/month</li>
            </ul>
          ` : `
            <ul>
              <li>Everything in Advanced, plus:</li>
              <li>AI lead scoring</li>
              <li>AI email generator</li>
              <li>AI niche analysis</li>
              <li>Smart alerts</li>
              <li>5,000 leads/month</li>
            </ul>
          `}
          <p><a href="${Deno.env.get("SUPABASE_URL")}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Start Using Your New Features</a></p>
          <p>Thank you for choosing NichePerQ!</p>
          <p>Best regards,<br>The NichePerQ Team</p>
        `;
        break;

      case "downgrade":
        subject = "Your Subscription Has Been Updated";
        htmlContent = `
          <h1>Hello ${name || "there"},</h1>
          <p>Your subscription has been changed from <strong>${previous_plan}</strong> to <strong>${plan_name}</strong>.</p>
          <p>Your new plan features will be active at the end of your current billing period.</p>
          <p>If this change was made by mistake, you can upgrade again at any time from your account settings.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")}/settings" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Manage Subscription</a></p>
          <p>Best regards,<br>The NichePerQ Team</p>
        `;
        break;

      case "cancel":
        subject = "We're Sorry to See You Go";
        htmlContent = `
          <h1>Hello ${name || "there"},</h1>
          <p>Your subscription has been cancelled. Your current plan will remain active until the end of your billing period.</p>
          <p>After that, you'll be moved to our free plan with the following features:</p>
          <ul>
            <li>5 niche searches per month</li>
            <li>10 lead previews per search</li>
            <li>Basic business information</li>
          </ul>
          <p>We'd love to know why you're leaving. Your feedback helps us improve.</p>
          <p>If you change your mind, you can reactivate your subscription anytime from your account settings.</p>
          <p><a href="${Deno.env.get("SUPABASE_URL")}/settings" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reactivate Subscription</a></p>
          <p>Best regards,<br>The NichePerQ Team</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "NichePerQ <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log("Subscription notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending subscription notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
