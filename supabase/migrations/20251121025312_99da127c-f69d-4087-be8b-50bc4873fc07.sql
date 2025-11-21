-- Create API usage tracking table
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL DEFAULT 'lead_scrape',
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at);

-- Create function to get monthly usage count
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(leads_count), 0)::INTEGER
  FROM public.api_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now());
$$;

-- Create function to get user's monthly limit based on role
CREATE OR REPLACE FUNCTION public.get_user_monthly_limit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN role = 'admin' THEN -1  -- unlimited
    WHEN role = 'pro' THEN 1000  -- 1000 leads per month
    ELSE 50  -- free: 50 leads per month
  END
  FROM public.user_roles
  WHERE user_id = p_user_id;
$$;