import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption using base64 (in production, use proper encryption)
function encrypt(text: string): string {
  return btoa(text);
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
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed: ' + userError.message);
    }
    
    if (!user) {
      throw new Error('No user found');
    }

    console.log('User authenticated:', user.id);

    const body = await req.json();
    const { provider, from_name, from_email, smtp_host, smtp_port, smtp_username, smtp_password } = body;

    // Validate required fields
    if (!provider || !from_name || !from_email) {
      throw new Error('Missing required fields');
    }

    if (provider === 'smtp' && (!smtp_host || !smtp_port || !smtp_username || !smtp_password)) {
      throw new Error('Missing SMTP configuration');
    }

    // Check if user already has an email account
    const { data: existing } = await supabaseClient
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const accountData = {
      user_id: user.id,
      provider,
      from_name,
      from_email,
      smtp_host: provider === 'smtp' ? smtp_host : null,
      smtp_port: provider === 'smtp' ? smtp_port : null,
      smtp_username: provider === 'smtp' ? smtp_username : null,
      smtp_password_enc: provider === 'smtp' ? encrypt(smtp_password) : null,
      is_verified: false,
    };

    let result;
    if (existing) {
      // Update existing account
      result = await supabaseClient
        .from('email_accounts')
        .update(accountData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Create new account
      result = await supabaseClient
        .from('email_accounts')
        .insert(accountData)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return new Response(JSON.stringify(result.data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in save-email-account:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});