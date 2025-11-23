// Auto-tagging logic for leads based on their data quality and attributes

export const generateAutoTags = (lead: any): string[] => {
  const tags: string[] = [];

  // Data completeness tags
  if (lead.phone) tags.push('Phone Available');
  if (lead.website) tags.push('Website Available');
  if (lead.email) tags.push('Email Available');
  
  // Business quality tags
  if (lead.rating && lead.rating >= 4.5) {
    tags.push('High Rated');
  }
  if (lead.review_count && lead.review_count >= 50) {
    tags.push('Established');
  }
  if (lead.review_count && lead.review_count >= 100) {
    tags.push('Popular');
  }

  // Contact info quality
  const hasPhone = !!lead.phone;
  const hasWebsite = !!lead.website;
  const hasEmail = !!lead.email;
  
  if (hasPhone && hasWebsite && hasEmail) {
    tags.push('Complete Info');
  } else if (!hasPhone && !hasWebsite && !hasEmail) {
    tags.push('Limited Info');
  }

  // Owner/decision maker indicators
  if (lead.business_name?.toLowerCase().includes('owner') || 
      lead.business_name?.toLowerCase().includes('proprietor')) {
    tags.push('Owner Contact');
  }

  // Geographic tags
  if (lead.city) {
    tags.push(lead.city);
  }

  // Niche-specific tags
  if (lead.niche) {
    tags.push(lead.niche);
  }

  // AI score-based tags
  if (lead.ai_quality_score !== null) {
    if (lead.ai_quality_score >= 80) {
      tags.push('High Quality');
    } else if (lead.ai_quality_score <= 40) {
      tags.push('Low Quality');
    }
  }

  if (lead.sentiment === 'hot') {
    tags.push('Hot Lead');
  } else if (lead.sentiment === 'cold') {
    tags.push('Cold Lead');
  }

  if (lead.closing_probability !== null && lead.closing_probability >= 75) {
    tags.push('High Conversion');
  }

  // Status-based tags
  if (lead.contact_status === 'new') {
    tags.push('Needs Outreach');
  } else if (lead.contact_status === 'active_partner') {
    tags.push('Active Client');
  }

  // Remove duplicates and limit to most relevant tags
  return [...new Set(tags)].slice(0, 8);
};

export const applyAutoTags = async (supabaseClient: any, leadId: string, userId: string) => {
  try {
    // Fetch the lead
    const { data: lead, error: fetchError } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !lead) {
      console.error('Error fetching lead for auto-tagging:', fetchError);
      return;
    }

    // Generate auto tags
    const autoTags = generateAutoTags(lead);
    
    // Merge with existing manual tags (preserve user-added tags)
    const existingTags = lead.tags || [];
    const manualTags = existingTags.filter((tag: string) => 
      !autoTags.includes(tag) && 
      !['Phone Available', 'Website Available', 'Email Available', 'High Rated', 
        'Established', 'Popular', 'Complete Info', 'Limited Info', 'Owner Contact',
        'High Quality', 'Low Quality', 'Hot Lead', 'Cold Lead', 'High Conversion',
        'Needs Outreach', 'Active Client'].includes(tag)
    );

    const allTags = [...manualTags, ...autoTags];

    // Update the lead
    const { error: updateError } = await supabaseClient
      .from('leads')
      .update({ tags: allTags })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead tags:', updateError);
    }
  } catch (error) {
    console.error('Error in applyAutoTags:', error);
  }
};
