-- Create function to check if user is admin (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND role = 'admin'
  );
$$;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Allow admins to view all API usage
CREATE POLICY "Admins can view all usage"
  ON public.api_usage FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create a function to get usage stats for a user
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id UUID)
RETURNS TABLE (
  total_leads INTEGER,
  monthly_leads INTEGER,
  last_search_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(leads_count), 0)::INTEGER as total_leads,
    COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', now()) THEN leads_count ELSE 0 END), 0)::INTEGER as monthly_leads,
    MAX(created_at) as last_search_date
  FROM public.api_usage
  WHERE user_id = p_user_id;
$$;