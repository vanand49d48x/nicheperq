-- Create lead_reviews table to store actual review text for AI analysis
CREATE TABLE IF NOT EXISTS public.lead_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  review_text TEXT NOT NULL,
  rating NUMERIC,
  author_name TEXT,
  review_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.lead_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lead reviews"
  ON public.lead_reviews
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead reviews"
  ON public.lead_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_lead_reviews_lead_id ON public.lead_reviews(lead_id);
CREATE INDEX idx_lead_reviews_user_id ON public.lead_reviews(user_id);