import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SignupRequest {
  email: string;
  name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: SignupRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "NichePerQ <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to NichePerQ!",
      html: `
        <h1>Welcome to NichePerQ, ${name || "there"}!</h1>
        <p>Thank you for signing up for NichePerQ - your ultimate tool for niche insights and real growth.</p>
        <h2>Getting Started</h2>
        <p>Here's what you can do with your free account:</p>
        <ul>
          <li>5 niche searches per month</li>
          <li>10 lead previews per search</li>
          <li>View basic business information</li>
        </ul>
        <p>Ready to unlock more features? Upgrade your account to get:</p>
        <ul>
          <li>Unlimited niche searches</li>
          <li>Full lead details including phone and email</li>
          <li>CSV export capabilities</li>
          <li>CRM and AI-powered features</li>
        </ul>
        <p><a href="${Deno.env.get("SUPABASE_URL")}/pricing" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Pricing Plans</a></p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The NichePerQ Team</p>
      `,
    });

    console.log("Signup confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending signup confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
