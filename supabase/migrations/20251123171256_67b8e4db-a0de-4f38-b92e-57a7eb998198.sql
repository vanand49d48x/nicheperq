-- Add schedule_time column to saved_searches table
ALTER TABLE public.saved_searches 
ADD COLUMN IF NOT EXISTS schedule_time text DEFAULT '09:00';

COMMENT ON COLUMN public.saved_searches.schedule_time IS 'Preferred time for scheduled searches in HH:MM format';