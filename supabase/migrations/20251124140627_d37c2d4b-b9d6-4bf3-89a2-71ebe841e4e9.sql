-- Fix search_path security warnings for workflow auto-enrollment functions
ALTER FUNCTION auto_enroll_new_lead() SET search_path = public;
ALTER FUNCTION auto_enroll_status_change() SET search_path = public;