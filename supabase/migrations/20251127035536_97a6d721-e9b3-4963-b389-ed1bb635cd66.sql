-- Drop the existing constraint
ALTER TABLE lead_interactions 
DROP CONSTRAINT IF EXISTS lead_interactions_interaction_type_check;

-- Add updated constraint with workflow types
ALTER TABLE lead_interactions 
ADD CONSTRAINT lead_interactions_interaction_type_check 
CHECK (interaction_type IN (
  'email_sent',
  'email_opened', 
  'email_clicked',
  'email_replied',
  'call_made',
  'meeting_scheduled',
  'note_added',
  'status_changed',
  'workflow_enrolled',
  'workflow_step_completed',
  'workflow_completed'
));