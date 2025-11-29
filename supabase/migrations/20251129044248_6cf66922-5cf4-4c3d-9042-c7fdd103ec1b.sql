-- Add scheduling fields to ai_workflows table
ALTER TABLE public.ai_workflows 
ADD COLUMN IF NOT EXISTS preferred_send_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS respect_business_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS business_hours_start TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS business_hours_end TIME DEFAULT '17:00:00';

-- Add performance tracking fields to workflow_enrollments
ALTER TABLE public.workflow_enrollments
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_replied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE;

-- Create workflow_performance_metrics table for aggregated stats
CREATE TABLE IF NOT EXISTS public.workflow_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_enrollments INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_replied INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  reply_rate NUMERIC(5,2) DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on workflow_performance_metrics
ALTER TABLE public.workflow_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow_performance_metrics
CREATE POLICY "Users can view own workflow metrics"
  ON public.workflow_performance_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_workflows
      WHERE ai_workflows.id = workflow_performance_metrics.workflow_id
      AND ai_workflows.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workflow metrics"
  ON public.workflow_performance_metrics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_workflows
      WHERE ai_workflows.id = workflow_performance_metrics.workflow_id
      AND ai_workflows.user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_performance_workflow_id 
  ON public.workflow_performance_metrics(workflow_id);
  
CREATE INDEX IF NOT EXISTS idx_workflow_performance_period 
  ON public.workflow_performance_metrics(period_start, period_end);

-- Add trigger to update workflow_performance_metrics.updated_at
CREATE TRIGGER update_workflow_performance_metrics_updated_at
  BEFORE UPDATE ON public.workflow_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();