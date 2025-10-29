-- Add latitude and longitude columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Create index for geographic queries
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON public.leads(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;