import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase.rpc('get_user_role', { user_id: user.id });
    if (roleData !== 'admin') {
      throw new Error("Admin access required");
    }

    const logs: any[] = [];

    // Query edge function logs using the analytics query
    try {
      const edgeFunctionResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/run_analytics_query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            query_text: `
              select id, function_edge_logs.timestamp, event_message, m.function_id, 
                     response.status_code, request.method
              from function_edge_logs
              cross join unnest(metadata) as m
              cross join unnest(m.response) as response
              cross join unnest(m.request) as request
              order by timestamp desc
              limit 50
            `
          })
        }
      );

      if (edgeFunctionResponse.ok) {
        const edgeLogs = await edgeFunctionResponse.json();
        if (edgeLogs && Array.isArray(edgeLogs)) {
          edgeLogs.forEach((log: any) => {
            logs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: 'edge_function',
              level: (log.status_code && log.status_code >= 400) ? 'error' : 'info',
              function_name: log.function_id,
              event_message: log.event_message,
            });
          });
        }
      }
    } catch (e) {
      console.error('Error fetching edge logs:', e);
    }

    // Query postgres logs
    try {
      const postgresResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/run_analytics_query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            query_text: `
              select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity
              from postgres_logs
              cross join unnest(metadata) as m
              cross join unnest(m.parsed) as parsed
              where parsed.error_severity IN ('ERROR', 'FATAL', 'PANIC', 'WARNING')
              order by timestamp desc
              limit 50
            `
          })
        }
      );

      if (postgresResponse.ok) {
        const dbLogs = await postgresResponse.json();
        if (dbLogs && Array.isArray(dbLogs)) {
          dbLogs.forEach((log: any) => {
            logs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: 'database',
              level: log.error_severity === 'ERROR' ? 'error' : 'warn',
              event_message: log.event_message,
              error_severity: log.error_severity,
            });
          });
        }
      }
    } catch (e) {
      console.error('Error fetching db logs:', e);
    }

    // Query auth logs
    try {
      const authResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/run_analytics_query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            query_text: `
              select id, auth_logs.timestamp, event_message, metadata.level, 
                     metadata.status, metadata.path, metadata.msg
              from auth_logs
              cross join unnest(metadata) as metadata
              where metadata.status >= 400
              order by timestamp desc
              limit 50
            `
          })
        }
      );

      if (authResponse.ok) {
        const authLogs = await authResponse.json();
        if (authLogs && Array.isArray(authLogs)) {
          authLogs.forEach((log: any) => {
            logs.push({
              id: log.id,
              timestamp: log.timestamp,
              type: 'auth',
              level: (log.status && log.status >= 500) ? 'error' : 'warn',
              event_message: log.msg || log.event_message,
              user_email: log.path,
            });
          });
        }
      }
    } catch (e) {
      console.error('Error fetching auth logs:', e);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return new Response(JSON.stringify({ logs: logs.slice(0, 200) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching system logs:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
