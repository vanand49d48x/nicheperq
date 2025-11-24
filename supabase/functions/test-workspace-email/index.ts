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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { email_account_id, test_recipient } = await req.json();

    // Get email account
    const { data: emailAccount, error: accountError } = await supabaseClient
      .from('email_accounts')
      .select('*')
      .eq('id', email_account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !emailAccount) {
      throw new Error('Email account not found');
    }

    if (emailAccount.provider !== 'smtp') {
      throw new Error('Only SMTP is supported for testing');
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

    // Send test email
    await client.send({
      from: `${emailAccount.from_name} <${emailAccount.from_email}>`,
      to: test_recipient,
      subject: "Test Email from NichePerQ",
      content: "This is a test email to verify your SMTP configuration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your workflow emails will be sent successfully!</p>
          <hr style="margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Sent from NichePerQ</p>
        </div>
      `,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-workspace-email:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});