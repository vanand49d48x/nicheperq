-- Create leads table for storing scraped business data
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zipcode TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (will add auth later if needed)
CREATE POLICY "Allow public read access to leads"
  ON public.leads FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to leads"
  ON public.leads FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access to leads"
  ON public.leads FOR DELETE
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_leads_niche ON public.leads(niche);
CREATE INDEX idx_leads_city ON public.leads(city);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);