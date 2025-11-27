-- Add indexes to improve workflow and automation query performance

-- Index on ai_workflows.user_id to speed up workflow queries
CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_id ON public.ai_workflows(user_id);

-- Composite index for user_id + created_at ordering
CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_created ON public.ai_workflows(user_id, created_at DESC);

-- Index on workflow_enrollments.user_id
CREATE INDEX IF NOT EXISTS idx_workflow_enrollments_user_id ON public.workflow_enrollments(user_id);

-- Index on ai_automation_logs.user_id
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_id ON public.ai_automation_logs(user_id);

-- Composite index for automation logs user + date
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_created ON public.ai_automation_logs(user_id, created_at DESC);