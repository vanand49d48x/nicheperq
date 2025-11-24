import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decrypt(text: string): string {
  return atob(text);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, to_email, subject, body_text, body_html } = await req.json();

    if (!user_id || !to_email || !subject || !body_text) {
      throw new Error('Missing required fields');
    }

    // Get user's email account
    const { data: emailAccount, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_verified', true)
      .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    if (!emailAccount) {
      return new Response(JSON.stringify({ 
        error: 'NO_EMAIL_ACCOUNT',
        message: 'No verified email account configured for this workspace'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (emailAccount.provider !== 'smtp') {
      throw new Error('Only SMTP is currently supported');
    }

    // Decrypt SMTP password
    const smtpPassword = decrypt(emailAccount.smtp_password_enc);

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: emailAccount.smtp_host,
        port: emailAccount.smtp_port,
        tls: true,
        auth: {
          username: emailAccount.smtp_username,
          password: smtpPassword,
        },
      },
    });

    // Send email
    await client.send({
      from: `${emailAccount.from_name} <${emailAccount.from_email}>`,
      to: to_email,
      subject: subject,
      content: body_text,
      html: body_html || body_text,
    });

    await client.close();

    console.log(`✅ Email sent to ${to_email} from ${emailAccount.from_email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-workspace-email:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});