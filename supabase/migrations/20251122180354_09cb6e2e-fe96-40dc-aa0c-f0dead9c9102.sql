-- Add custom_lead_limit column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN custom_lead_limit INTEGER NULL;

COMMENT ON COLUMN public.user_roles.custom_lead_limit IS 'Custom monthly lead limit for this user. NULL means use role-based default.';

-- Update get_user_monthly_limit function to check custom limit first
CREATE OR REPLACE FUNCTION public.get_user_monthly_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    custom_lead_limit,  -- Use custom limit if set
    CASE 
      WHEN role = 'admin' THEN -1  -- unlimited
      WHEN role = 'pro' THEN 5000
      WHEN role = 'advanced' THEN 2500
      WHEN role = 'standard' THEN 500
      ELSE 50  -- free tier
    END
  )
  FROM public.user_roles
  WHERE user_id = p_user_id;
$$;