-- Add AI scoring columns to leads table
ALTER TABLE public.leads
ADD COLUMN ai_quality_score INTEGER CHECK (ai_quality_score >= 0 AND ai_quality_score <= 100),
ADD COLUMN ai_intent_score INTEGER CHECK (ai_intent_score >= 0 AND ai_intent_score <= 100),
ADD COLUMN closing_probability INTEGER CHECK (closing_probability >= 0 AND closing_probability <= 100),
ADD COLUMN risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
ADD COLUMN recommended_action TEXT,
ADD COLUMN recommended_tone TEXT CHECK (recommended_tone IN ('friendly', 'professional', 'direct')),
ADD COLUMN sentiment TEXT CHECK (sentiment IN ('hot', 'warm', 'cold')),
ADD COLUMN last_ai_analysis_at TIMESTAMP WITH TIME ZONE;

-- Create lead_ai_scores table for historical tracking
CREATE TABLE public.lead_ai_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  intent_score INTEGER NOT NULL CHECK (intent_score >= 0 AND intent_score <= 100),
  closing_probability INTEGER NOT NULL CHECK (closing_probability >= 0 AND closing_probability <= 100),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reasoning JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for lead_ai_scores
ALTER TABLE public.lead_ai_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_ai_scores
CREATE POLICY "Users can view own lead scores"
ON public.lead_ai_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_ai_scores.lead_id
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own lead scores"
ON public.lead_ai_scores
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_ai_scores.lead_id
    AND leads.user_id = auth.uid()
  )
);

-- Add index for performance
CREATE INDEX idx_lead_ai_scores_lead_id ON public.lead_ai_scores(lead_id);
CREATE INDEX idx_leads_sentiment ON public.leads(sentiment);
CREATE INDEX idx_leads_ai_quality_score ON public.leads(ai_quality_score);