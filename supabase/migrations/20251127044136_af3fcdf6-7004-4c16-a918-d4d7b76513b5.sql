-- Create composite index for ai_automation_logs queries
-- This index will speed up queries that filter by user_id, action_type, and created_at
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_action_time 
ON ai_automation_logs(user_id, action_type, created_at DESC);

-- Create index for user_id and created_at (for queries without action_type filter)
CREATE INDEX IF NOT EXISTS idx_ai_automation_logs_user_time 
ON ai_automation_logs(user_id, created_at DESC);