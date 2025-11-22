-- Update get_user_monthly_limit function for new tier structure
CREATE OR REPLACE FUNCTION public.get_user_monthly_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN role = 'admin' THEN -1  -- unlimited
    WHEN role = 'pro' THEN 5000  -- Pro tier: 5,000 leads per month
    WHEN role = 'advanced' THEN 2500  -- Advanced tier: 2,500 leads per month
    WHEN role = 'standard' THEN 500   -- Standard tier: 500 leads per month
    ELSE 50  -- free tier: 5 searches × 10 preview leads = 50 total
  END
  FROM public.user_roles
  WHERE user_id = p_user_id;
$function$;

-- Create table to track free tier monthly searches (5 searches/month limit)
CREATE TABLE IF NOT EXISTS public.free_tier_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_count integer NOT NULL DEFAULT 0,
  month_start timestamp with time zone NOT NULL DEFAULT date_trunc('month', now()),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_start)
);

-- Enable RLS on free_tier_searches
ALTER TABLE public.free_tier_searches ENABLE ROW LEVEL SECURITY;

-- RLS policies for free_tier_searches
CREATE POLICY "Users can view own search count"
  ON public.free_tier_searches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search count"
  ON public.free_tier_searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search count"
  ON public.free_tier_searches
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add feature access flags to user_roles table
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS has_crm_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_ai_access boolean NOT NULL DEFAULT false;

-- Add index for performance on free_tier_searches
CREATE INDEX IF NOT EXISTS idx_free_tier_searches_user_month 
  ON public.free_tier_searches(user_id, month_start);

-- Add is_preview column to leads table to mark free tier preview leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_preview boolean NOT NULL DEFAULT false;