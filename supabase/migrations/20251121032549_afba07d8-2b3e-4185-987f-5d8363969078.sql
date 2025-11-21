-- Add new subscription tiers to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'standard';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'advanced';