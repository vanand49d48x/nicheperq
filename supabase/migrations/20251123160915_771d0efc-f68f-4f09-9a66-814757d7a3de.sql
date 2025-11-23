-- Drop the old steps column and create proper workflow_steps table
ALTER TABLE public.ai_workflows DROP COLUMN IF EXISTS steps;

-- Create workflow_steps table with branching support
CREATE TABLE public.workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_email', 'set_reminder', 'update_status', 'wait', 'add_note')),
  delay_days INTEGER NOT NULL DEFAULT 0,
  
  -- Email-specific fields
  tone TEXT CHECK (tone IN ('friendly', 'professional', 'direct')),
  email_type TEXT,
  ai_prompt_hint TEXT,
  
  -- Task/Reminder fields
  task_title TEXT,
  task_description TEXT,
  
  -- Status update fields
  next_status TEXT,
  
  -- Branching conditions
  condition_type TEXT CHECK (condition_type IN ('none', 'email_opened', 'email_clicked', 'email_replied', 'no_response', 'status_equals')),
  condition_value TEXT,
  branch_to_step_order INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow_enrollments table
CREATE TABLE public.workflow_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  current_step_order INTEGER NOT NULL DEFAULT 1,
  next_action_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'failed')) DEFAULT 'active',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, workflow_id)
);

-- Enhance email_tracking table with detailed event data
ALTER TABLE public.email_tracking 
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_steps
CREATE POLICY "Users can view own workflow steps"
ON public.workflow_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_workflows
    WHERE ai_workflows.id = workflow_steps.workflow_id
    AND ai_workflows.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own workflow steps"
ON public.workflow_steps
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_workflows
    WHERE ai_workflows.id = workflow_steps.workflow_id
    AND ai_workflows.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own workflow steps"
ON public.workflow_steps
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ai_workflows
    WHERE ai_workflows.id = workflow_steps.workflow_id
    AND ai_workflows.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own workflow steps"
ON public.workflow_steps
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ai_workflows
    WHERE ai_workflows.id = workflow_steps.workflow_id
    AND ai_workflows.user_id = auth.uid()
  )
);

-- RLS Policies for workflow_enrollments
CREATE POLICY "Users can view own enrollments"
ON public.workflow_enrollments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
ON public.workflow_enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
ON public.workflow_enrollments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments"
ON public.workflow_enrollments
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_step_order ON public.workflow_steps(workflow_id, step_order);
CREATE INDEX idx_workflow_enrollments_lead_id ON public.workflow_enrollments(lead_id);
CREATE INDEX idx_workflow_enrollments_workflow_id ON public.workflow_enrollments(workflow_id);
CREATE INDEX idx_workflow_enrollments_status ON public.workflow_enrollments(status);
CREATE INDEX idx_workflow_enrollments_next_action_at ON public.workflow_enrollments(next_action_at) WHERE status = 'active';

-- Add trigger for updated_at
CREATE TRIGGER update_workflow_enrollments_updated_at
BEFORE UPDATE ON public.workflow_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();