-- Add 'status' to workflow_steps action_type check constraint
ALTER TABLE public.workflow_steps 
DROP CONSTRAINT IF EXISTS workflow_steps_action_type_check;

ALTER TABLE public.workflow_steps 
ADD CONSTRAINT workflow_steps_action_type_check 
CHECK (action_type IN ('email', 'delay', 'condition', 'status', 'task'));