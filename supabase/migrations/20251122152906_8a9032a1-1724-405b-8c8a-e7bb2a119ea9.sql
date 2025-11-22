-- Add CRM tier tracking to user_roles table
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS crm_tier TEXT DEFAULT 'lite';

-- Create ai_email_drafts table for AI-generated emails
CREATE TABLE IF NOT EXISTS public.ai_email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  status TEXT NOT NULL DEFAULT 'draft',
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_tone CHECK (tone IN ('professional', 'friendly', 'direct')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'approved', 'sent', 'rejected'))
);

-- Create ai_automation_logs table for tracking AI actions
CREATE TABLE IF NOT EXISTS public.ai_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  ai_decision JSONB,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_action_type CHECK (action_type IN ('email_sent', 'status_changed', 'task_created', 'email_drafted', 'workflow_executed'))
);

-- Create ai_workflows table for automation workflows
CREATE TABLE IF NOT EXISTS public.ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL,
  steps JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create email_tracking table for email events
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_draft_id UUID NOT NULL REFERENCES public.ai_email_drafts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'))
);

-- Enable RLS on all new tables
ALTER TABLE public.ai_email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_email_drafts
CREATE POLICY "Users can view own email drafts"
  ON public.ai_email_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email drafts"
  ON public.ai_email_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email drafts"
  ON public.ai_email_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email drafts"
  ON public.ai_email_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_automation_logs
CREATE POLICY "Users can view own automation logs"
  ON public.ai_automation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation logs"
  ON public.ai_automation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_workflows
CREATE POLICY "Users can view own workflows"
  ON public.ai_workflows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflows"
  ON public.ai_workflows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON public.ai_workflows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON public.ai_workflows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_tracking
CREATE POLICY "Users can view own email tracking"
  ON public.email_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_email_drafts
      WHERE ai_email_drafts.id = email_tracking.email_draft_id
      AND ai_email_drafts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own email tracking"
  ON public.email_tracking FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_email_drafts
      WHERE ai_email_drafts.id = email_tracking.email_draft_id
      AND ai_email_drafts.user_id = auth.uid()
    )
  );

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_user_id ON public.ai_email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_lead_id ON public.ai_email_drafts(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_status ON public.ai_email_drafts(status);
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_id ON public.ai_automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_id ON public.ai_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_draft_id ON public.email_tracking(email_draft_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_email_drafts_updated_at
  BEFORE UPDATE ON public.ai_email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ai_workflows_updated_at
  BEFORE UPDATE ON public.ai_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();