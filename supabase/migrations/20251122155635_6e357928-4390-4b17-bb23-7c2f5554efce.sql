-- Add scheduling fields to saved_searches table
ALTER TABLE public.saved_searches
ADD COLUMN is_scheduled BOOLEAN DEFAULT false,
ADD COLUMN schedule_frequency TEXT DEFAULT 'weekly' CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
ADD COLUMN next_run_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add search_id to leads to track which search generated them
ALTER TABLE public.leads
ADD COLUMN search_id UUID REFERENCES public.saved_searches(id) ON DELETE SET NULL;

-- Create index for efficient querying of scheduled searches
CREATE INDEX idx_saved_searches_scheduled ON public.saved_searches(is_scheduled, is_active, next_run_at) WHERE is_scheduled = true AND is_active = true;

-- Create index for filtering leads by search
CREATE INDEX idx_leads_search_id ON public.leads(search_id, created_at DESC);

-- Create a table to track scheduled search runs
CREATE TABLE public.scheduled_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leads_found INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on scheduled_search_runs
ALTER TABLE public.scheduled_search_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_search_runs
CREATE POLICY "Users can view own search runs"
ON public.scheduled_search_runs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search runs"
ON public.scheduled_search_runs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_scheduled_search_runs_search ON public.scheduled_search_runs(search_id, executed_at DESC);
CREATE INDEX idx_scheduled_search_runs_user ON public.scheduled_search_runs(user_id, executed_at DESC);