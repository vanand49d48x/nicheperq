import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_OAUTH_CLIENT_ID');
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/outlook-oauth-callback`;

    if (!MICROSOFT_CLIENT_ID) {
      throw new Error('MICROSOFT_OAUTH_CLIENT_ID not configured');
    }

    const scopes = [
      'https://outlook.office.com/SMTP.Send',
      'https://graph.microsoft.com/User.Read',
      'offline_access'
    ].join(' ');

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_mode', 'query');

    // Get user ID from auth header
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const userId = authHeader.split('Bearer ')[1];
      authUrl.searchParams.set('state', userId || '');
    }

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in outlook-oauth-init:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
