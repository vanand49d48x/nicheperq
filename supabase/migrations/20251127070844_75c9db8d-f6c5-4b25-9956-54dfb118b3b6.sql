-- Add composite index for ai_automation_logs with action_type filtering
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_action_created 
ON public.ai_automation_logs(user_id, action_type, created_at DESC);

-- Add index on ai_email_drafts for user queries
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_user_id 
ON public.ai_email_drafts(user_id);

-- Composite index for email drafts with date ordering
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_user_created 
ON public.ai_email_drafts(user_id, created_at DESC);

-- Index for email draft status queries
CREATE INDEX IF NOT EXISTS idx_ai_email_drafts_user_status 
ON public.ai_email_drafts(user_id, status);