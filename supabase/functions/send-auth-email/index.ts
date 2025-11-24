import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { MagicLinkEmail } from "./_templates/magic-link.tsx";
import { SignupConfirmationEmail } from "./_templates/signup-confirmation.tsx";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_AUTH_EMAIL_HOOK_SECRET") as string;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const webhookData = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    const { user, email_data } = webhookData;
    const { token, token_hash, redirect_to, email_action_type } = email_data;

    let html: string;
    let subject: string;

    // Route to appropriate template based on email action type
    switch (email_action_type) {
      case "magic_link":
      case "recovery":
        html = await renderAsync(
          React.createElement(email_action_type === "magic_link" ? MagicLinkEmail : PasswordResetEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = email_action_type === "magic_link" 
          ? "Your NichePerQ Login Link" 
          : "Reset Your NichePerQ Password";
        break;

      case "signup":
      case "invite":
        html = await renderAsync(
          React.createElement(SignupConfirmationEmail, {
            supabase_url: Deno.env.get("SUPABASE_URL") ?? "",
            token,
            token_hash,
            redirect_to,
            email_action_type,
          })
        );
        subject = "Welcome to NichePerQ!";
        break;

      default:
        console.log(`Unhandled email action type: ${email_action_type}`);
        return new Response(JSON.stringify({ error: "Unsupported email type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }

    const { error } = await resend.emails.send({
      from: "NichePerQ <support@nicheperq.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${user.email} for ${email_action_type}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code,
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
