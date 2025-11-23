import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled search executor...');

    // Find all scheduled searches that need to run
    const now = new Date().toISOString();
    const { data: scheduledSearches, error: fetchError } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('is_scheduled', true)
      .eq('is_active', true)
      .lte('next_run_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled searches:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledSearches?.length || 0} searches to execute`);

    const results = [];

    for (const search of scheduledSearches || []) {
      console.log(`Executing search: ${search.name} for user: ${search.user_id}`);
      
      try {
        // Call the scrape-leads function
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-leads', {
          body: {
            niche: search.niche,
            city: search.city,
            radius: search.radius,
            search_id: search.id,
          },
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        });

        if (scrapeError) {
          console.error(`Error scraping leads for search ${search.id}:`, scrapeError);
          
          // Log failed run
          await supabase.from('scheduled_search_runs').insert({
            search_id: search.id,
            user_id: search.user_id,
            leads_found: 0,
            status: 'failed',
            error_message: scrapeError.message || 'Unknown error',
          });

          results.push({ search_id: search.id, status: 'failed', error: scrapeError.message });
          continue;
        }

        const leadsCount = scrapeData?.leads?.length || 0;
        console.log(`Successfully scraped ${leadsCount} leads for search ${search.id}`);

        // Log successful run
        await supabase.from('scheduled_search_runs').insert({
          search_id: search.id,
          user_id: search.user_id,
          leads_found: leadsCount,
          status: 'success',
        });

        // Calculate next run time
        let nextRunAt = new Date();
        const scheduleTime = search.schedule_time || '09:00';
        const [hours, minutes] = scheduleTime.split(':').map(Number);
        
        switch (search.schedule_frequency) {
          case 'daily':
            nextRunAt.setDate(nextRunAt.getDate() + 1);
            break;
          case 'weekly':
            nextRunAt.setDate(nextRunAt.getDate() + 7);
            break;
          case 'monthly':
            nextRunAt.setMonth(nextRunAt.getMonth() + 1);
            break;
        }
        
        // Set the scheduled time
        nextRunAt.setHours(hours, minutes, 0, 0);

        // Update the search with next run time and last run time
        await supabase
          .from('saved_searches')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunAt.toISOString(),
            lead_count: (search.lead_count || 0) + leadsCount,
          })
          .eq('id', search.id);

        results.push({ search_id: search.id, status: 'success', leads_found: leadsCount });
      } catch (error) {
        console.error(`Unexpected error for search ${search.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
        
        await supabase.from('scheduled_search_runs').insert({
          search_id: search.id,
          user_id: search.user_id,
          leads_found: 0,
          status: 'failed',
          error_message: errorMessage,
        });

        results.push({ search_id: search.id, status: 'failed', error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        executed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scheduled-search-executor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});