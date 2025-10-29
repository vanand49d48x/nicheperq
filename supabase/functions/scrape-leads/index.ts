import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, city, radius } = await req.json();
    
    if (!niche || !city) {
      return new Response(
        JSON.stringify({ error: 'Niche and city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const outscraperApiKey = Deno.env.get('OUTSCRAPER_API_KEY');
    if (!outscraperApiKey) {
      console.error('OUTSCRAPER_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping ${niche} in ${city} with ${radius} mile radius`);

    // Build the search query for Outscraper
    const query = `${niche} in ${city}`;
    
    // Call Outscraper Google Maps API
    const outscraperUrl = `https://api.app.outscraper.com/maps/search-v3?query=${encodeURIComponent(query)}&limit=50&language=en&region=us`;
    
    console.log('Calling Outscraper API:', outscraperUrl);
    
    const response = await fetch(outscraperUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': outscraperApiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Outscraper API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Outscraper API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const outscraperData = await response.json();
    console.log('Outscraper response received, processing...');
    console.log('Full response structure:', JSON.stringify(outscraperData, null, 2));

    // Transform Outscraper data to our leads format
    const leads = [];
    
    if (outscraperData.data && outscraperData.data.length > 0) {
      for (const result of outscraperData.data) {
        if (result && Array.isArray(result)) {
          for (const business of result) {
            // Extract location info
            const addressParts = business.full_address?.split(',') || [];
            const stateZip = addressParts[addressParts.length - 1]?.trim().split(' ') || [];
            
            leads.push({
              niche,
              business_name: business.name || 'Unknown',
              address: business.street || business.full_address || null,
              city: business.city || city,
              state: business.state || stateZip[0] || null,
              zipcode: business.postal_code || stateZip[1] || null,
              phone: business.phone || null,
              website: business.site || null,
              rating: business.rating ? parseFloat(business.rating) : null,
              review_count: business.reviews ? parseInt(business.reviews) : null,
            });
          }
        }
      }
    }

    console.log(`Processed ${leads.length} leads`);

    if (leads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results found', leads: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save leads to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: savedLeads, error: dbError } = await supabase
      .from('leads')
      .insert(leads)
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save leads', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully saved ${savedLeads?.length || 0} leads to database`);

    return new Response(
      JSON.stringify({ success: true, leads: savedLeads, count: savedLeads?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-leads function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
