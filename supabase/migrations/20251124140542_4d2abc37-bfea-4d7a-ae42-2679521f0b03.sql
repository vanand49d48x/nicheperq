-- Create function to auto-enroll leads in workflows on insert
CREATE OR REPLACE FUNCTION auto_enroll_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  first_step RECORD;
  next_action_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find all active workflows with 'new_lead' trigger
  FOR workflow_record IN 
    SELECT * FROM ai_workflows 
    WHERE is_active = true 
    AND trigger->>'type' = 'new_lead'
    AND user_id = NEW.user_id
  LOOP
    -- Get first step to calculate next action time
    SELECT * INTO first_step 
    FROM workflow_steps 
    WHERE workflow_id = workflow_record.id 
    AND step_order = 1 
    LIMIT 1;
    
    IF first_step.id IS NOT NULL THEN
      next_action_time := NOW() + (COALESCE(first_step.delay_days, 0) || ' days')::INTERVAL;
      
      -- Create enrollment (ignore duplicates)
      INSERT INTO workflow_enrollments (
        lead_id,
        workflow_id,
        user_id,
        current_step_order,
        next_action_at,
        status,
        metadata
      ) VALUES (
        NEW.id,
        workflow_record.id,
        NEW.user_id,
        1,
        next_action_time,
        'active',
        jsonb_build_object(
          'trigger_type', 'new_lead',
          'enrolled_at', NOW()
        )
      ) ON CONFLICT (lead_id, workflow_id) DO NOTHING;
      
      -- Log interaction
      INSERT INTO lead_interactions (
        lead_id,
        user_id,
        interaction_type,
        metadata,
        occurred_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        'workflow_enrolled',
        jsonb_build_object(
          'workflow_id', workflow_record.id,
          'workflow_name', workflow_record.name,
          'trigger_type', 'new_lead'
        ),
        NOW()
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to auto-enroll leads in workflows on status change
CREATE OR REPLACE FUNCTION auto_enroll_status_change()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  first_step RECORD;
  next_action_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.contact_status IS DISTINCT FROM NEW.contact_status THEN
    -- Find all active workflows with 'status_change' trigger matching the new status
    FOR workflow_record IN 
      SELECT * FROM ai_workflows 
      WHERE is_active = true 
      AND trigger->>'type' = 'status_changed'
      AND trigger->>'status' = NEW.contact_status
      AND user_id = NEW.user_id
    LOOP
      -- Get first step to calculate next action time
      SELECT * INTO first_step 
      FROM workflow_steps 
      WHERE workflow_id = workflow_record.id 
      AND step_order = 1 
      LIMIT 1;
      
      IF first_step.id IS NOT NULL THEN
        next_action_time := NOW() + (COALESCE(first_step.delay_days, 0) || ' days')::INTERVAL;
        
        -- Create enrollment (ignore duplicates)
        INSERT INTO workflow_enrollments (
          lead_id,
          workflow_id,
          user_id,
          current_step_order,
          next_action_at,
          status,
          metadata
        ) VALUES (
          NEW.id,
          workflow_record.id,
          NEW.user_id,
          1,
          next_action_time,
          'active',
          jsonb_build_object(
            'trigger_type', 'status_changed',
            'old_status', OLD.contact_status,
            'new_status', NEW.contact_status,
            'enrolled_at', NOW()
          )
        ) ON CONFLICT (lead_id, workflow_id) DO NOTHING;
        
        -- Log interaction
        INSERT INTO lead_interactions (
          lead_id,
          user_id,
          interaction_type,
          metadata,
          occurred_at
        ) VALUES (
          NEW.id,
          NEW.user_id,
          'workflow_enrolled',
          jsonb_build_object(
            'workflow_id', workflow_record.id,
            'workflow_name', workflow_record.name,
            'trigger_type', 'status_changed',
            'old_status', OLD.contact_status,
            'new_status', NEW.contact_status
          ),
          NOW()
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on leads table
DROP TRIGGER IF EXISTS trigger_auto_enroll_new_lead ON leads;
CREATE TRIGGER trigger_auto_enroll_new_lead
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_new_lead();

DROP TRIGGER IF EXISTS trigger_auto_enroll_status_change ON leads;
CREATE TRIGGER trigger_auto_enroll_status_change
  AFTER UPDATE OF contact_status ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_enroll_status_change();