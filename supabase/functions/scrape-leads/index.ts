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
    const { niche, city, radius, search_id } = await req.json();
    console.log('Request body:', { niche, city, radius, search_id });
    
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode JWT to get user ID (JWT is already verified by Supabase when verify_jwt=true)
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    if (parts.length !== 3) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token payload' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User authenticated:', userId);

    // Get Supabase service client for checking limits
    const supabaseServiceUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseService = createClient(supabaseServiceUrl, supabaseServiceKey);

    // Get user role to check for free tier
    const { data: userRoleData } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    const userRole = userRoleData?.role || 'free';
    const isFreeUser = userRole === 'free';
    
    console.log('User role:', userRole);

    // FREE TIER: Check search count (5 searches/month limit)
    if (isFreeUser) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthStart = new Date(currentMonth + '-01').toISOString();
      
      // Get or create search counter for current month
      const { data: searchData } = await supabaseService
        .from('free_tier_searches')
        .select('search_count')
        .eq('user_id', userId)
        .eq('month_start', monthStart)
        .single();
      
      const currentSearchCount = searchData?.search_count || 0;
      
      console.log('Free tier search count:', currentSearchCount);
      
      // Check if user exceeded 5 searches
      if (currentSearchCount >= 5) {
        return new Response(
          JSON.stringify({ 
            error: 'Free tier search limit reached',
            details: 'You\'ve used all 5 searches this month. Upgrade to STANDARD for unlimited searches!',
            searchCount: currentSearchCount,
            searchLimit: 5
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Increment search count (upsert)
      await supabaseService
        .from('free_tier_searches')
        .upsert({
          user_id: userId,
          month_start: monthStart,
          search_count: currentSearchCount + 1
        }, {
          onConflict: 'user_id,month_start'
        });
    }

    // Check user's monthly limit and current usage
    const { data: limitData, error: limitError } = await supabaseService
      .rpc('get_user_monthly_limit', { p_user_id: userId });

    const { data: usageData, error: usageError } = await supabaseService
      .rpc('get_monthly_usage', { p_user_id: userId });

    if (limitError || usageError) {
      console.error('Error checking limits:', limitError || usageError);
      return new Response(
        JSON.stringify({ error: 'Failed to check usage limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const monthlyLimit = limitData as number;
    const currentUsage = usageData as number;

    console.log('User limits:', { monthlyLimit, currentUsage });

    // Check if user has exceeded their limit (-1 means unlimited for admin)
    if (monthlyLimit !== -1 && currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly limit reached',
          details: `You've reached your monthly limit of ${monthlyLimit} leads. Upgrade your plan for more.`,
          currentUsage,
          monthlyLimit
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
    
    // Call Outscraper Google Maps API with reviews enabled
    const outscraperUrl = `https://api.app.outscraper.com/maps/search-v3?query=${encodeURIComponent(query)}&limit=50&language=en&region=us&reviewsLimit=5&async=false`;
    
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
      latitude: number | null;
      longitude: number | null;
      user_id: string;
      search_id: string | null;
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

    // Array to store reviews for batch insert
    const reviewsToSave: Array<{
      lead_id: string;
      user_id: string;
      review_text: string;
      rating: number | null;
      author_name: string | null;
      review_date: string | null;
    }> = [];

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

      const latitude = business.latitude ?? business.lat ?? null;
      const longitude = business.longitude ?? business.lng ?? business.lon ?? null;

      const leadData = {
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
        latitude: latitude != null ? parseFloat(String(latitude)) : null,
        longitude: longitude != null ? parseFloat(String(longitude)) : null,
        user_id: userId,
        search_id: search_id || null,
      };

      leads.push(leadData);

      // Extract reviews if available (typically in business.reviews_data or business.reviews_list)
      const reviewsList = business.reviews_data || business.reviews_list || business.review_details || [];
      if (Array.isArray(reviewsList) && reviewsList.length > 0) {
        // Take top 5 reviews for each business
        const topReviews = reviewsList.slice(0, 5);
        for (const review of topReviews) {
          // We'll store these temporarily and associate them after leads are inserted
          reviewsToSave.push({
            lead_id: '', // Will be filled after lead insertion
            user_id: userId,
            review_text: review.text || review.review_text || review.comment || '',
            rating: review.rating ? parseFloat(String(review.rating)) : null,
            author_name: review.author_name || review.author || review.reviewer_name || null,
            review_date: review.review_datetime || review.date || review.review_date || null,
          });
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

    // FREE TIER: Limit to 10 leads and mark as preview
    let leadsToSave = leads;
    let isPreviewData = false;
    
    if (isFreeUser) {
      leadsToSave = leads.slice(0, 10).map(lead => ({
        ...lead,
        is_preview: true
      }));
      isPreviewData = true;
      console.log('Free tier: Limited to 10 preview leads');
    }

    // Check if adding these leads would exceed the limit (skip for free tier preview)
    if (!isFreeUser && monthlyLimit !== -1 && (currentUsage + leadsToSave.length) > monthlyLimit) {
      const remainingLeads = monthlyLimit - currentUsage;
      return new Response(
        JSON.stringify({ 
          error: 'Would exceed monthly limit',
          details: `This search would give you ${leads.length} leads, but you only have ${remainingLeads} remaining this month. Upgrade your plan for more.`,
          currentUsage,
          monthlyLimit,
          remainingLeads
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save leads to database
    const { data: savedLeads, error: dbError } = await supabaseService
      .from('leads')
      .insert(leadsToSave)
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save leads', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully saved ${savedLeads?.length || 0} leads to database`);
    
    // Save reviews for the leads (only if not free tier preview)
    if (!isFreeUser && reviewsToSave.length > 0 && savedLeads) {
      // Create a mapping of business names to lead IDs
      const leadIdMap = new Map<string, string>();
      savedLeads.forEach(lead => {
        leadIdMap.set(lead.business_name, lead.id);
      });

      // Associate reviews with their lead IDs
      const reviewsWithLeadIds = [];
      let reviewIndex = 0;
      for (const lead of leads) {
        const leadId = leadIdMap.get(lead.business_name);
        if (leadId) {
          // Get reviews for this lead
          const reviewsList = results[leads.indexOf(lead)]?.reviews_data || 
                            results[leads.indexOf(lead)]?.reviews_list || 
                            results[leads.indexOf(lead)]?.review_details || [];
          const topReviews = Array.isArray(reviewsList) ? reviewsList.slice(0, 5) : [];
          
          for (const review of topReviews) {
            if (review.text || review.review_text || review.comment) {
              reviewsWithLeadIds.push({
                lead_id: leadId,
                user_id: userId,
                review_text: review.text || review.review_text || review.comment || '',
                rating: review.rating ? parseFloat(String(review.rating)) : null,
                author_name: review.author_name || review.author || review.reviewer_name || null,
                review_date: review.review_datetime || review.date || review.review_date || null,
              });
            }
          }
        }
      }

      // Batch insert reviews
      if (reviewsWithLeadIds.length > 0) {
        const { error: reviewsError } = await supabaseService
          .from('lead_reviews')
          .insert(reviewsWithLeadIds);
        
        if (reviewsError) {
          console.error('Failed to save reviews:', reviewsError);
          // Don't fail the request if reviews fail to save
        } else {
          console.log(`Successfully saved ${reviewsWithLeadIds.length} reviews to database`);
        }
      }
    }
    
    // FREE TIER: Mask sensitive data in response
    let responseLeads = savedLeads;
    if (isFreeUser && savedLeads) {
      responseLeads = savedLeads.map(lead => ({
        ...lead,
        phone: lead.phone ? '(***) ***-****' : null,
        website: lead.website ? 'https://***.***/***' : null,
        is_preview: true
      }));
    }

    // Track API usage
    const { error: trackingError } = await supabaseService
      .from('api_usage')
      .insert({
        user_id: userId,
        search_type: 'lead_scrape',
        leads_count: savedLeads?.length || 0,
      });

    if (trackingError) {
      console.error('Failed to track usage:', trackingError);
      // Don't fail the request if usage tracking fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads: responseLeads,
        count: savedLeads?.length || 0,
        is_preview: isPreviewData,
        preview_message: isPreviewData ? 'Free tier: Showing 10 preview leads with masked contact info. Upgrade for full access!' : undefined,
        usage: {
          current: currentUsage + (savedLeads?.length || 0),
          limit: monthlyLimit,
          remaining: monthlyLimit === -1 ? -1 : monthlyLimit - currentUsage - (savedLeads?.length || 0)
        }
      }),
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
