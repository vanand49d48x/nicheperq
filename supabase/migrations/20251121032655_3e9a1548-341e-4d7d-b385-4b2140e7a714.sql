-- Update the get_user_monthly_limit function to handle new tiers
CREATE OR REPLACE FUNCTION public.get_user_monthly_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN role = 'admin' THEN -1  -- unlimited
    WHEN role = 'advanced' THEN 1000  -- 1000 leads per month
    WHEN role = 'standard' THEN 250   -- 250 leads per month
    WHEN role = 'basic' THEN 100      -- 100 leads per month
    WHEN role = 'pro' THEN 1000       -- legacy pro tier: 1000 leads
    ELSE 50  -- free: 50 leads per month
  END
  FROM public.user_roles
  WHERE user_id = p_user_id;
$function$;