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
    const outscraperUrl = `https://api.app.outscraper.com/maps/search-v3?query=${encodeURIComponent(query)}&limit=50&language=en&region=us&async=false`;
    
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

    // Normalize Outscraper response and transform to leads
    const leads: Array<{
      niche: string;
      business_name: string;
      address: string | null;
      city: string;
      state: string | null;
      zipcode: string | null;
      phone: string | null;
      website: string | null;
      rating: number | null;
      review_count: number | null;
    }> = [];

    let results: any[] = [];

    if (Array.isArray(outscraperData)) {
      results = outscraperData;
    } else if (outscraperData?.data) {
      if (Array.isArray(outscraperData.data)) {
        for (const block of outscraperData.data) {
          if (Array.isArray(block)) {
            results.push(...block);
          } else if (Array.isArray(block?.places)) {
            results.push(...(block.places as any[]));
          } else if (Array.isArray(block?.data)) {
            results.push(...(block.data as any[]));
          } else if (block) {
            results.push(block);
          }
        }
      }
    } else if (Array.isArray(outscraperData?.results)) {
      results = outscraperData.results;
    }

    for (const business of results) {
      const fullAddress: string | undefined = business.full_address || business.address;
      const addressParts = fullAddress ? String(fullAddress).split(',') : [];
      const lastPart = addressParts.length > 0 ? addressParts[addressParts.length - 1].trim() : '';
      const stateZip = lastPart ? lastPart.split(' ') : [];

      const name = business.name || business.title || business.company || 'Unknown';
      const website = business.site || business.website || business.domain || null;
      const phone = business.phone || business.phone_number || null;

      const ratingRaw = business.rating ?? business.rating_value ?? business.stars ?? null;
      const rating = ratingRaw != null ? parseFloat(String(ratingRaw)) : null;

      const reviewsRaw = business.reviews ?? business.review_count ?? business.reviews_count ?? null;
      const review_count = reviewsRaw != null ? parseInt(String(reviewsRaw)) : null;

      leads.push({
        niche,
        business_name: String(name),
        address: business.street || fullAddress || null,
        city: business.city || city,
        state: business.state || business.region || (stateZip[0] || null),
        zipcode: business.postal_code || business.zip || (stateZip[1] || null),
        phone,
        website,
        rating,
        review_count,
      });
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
