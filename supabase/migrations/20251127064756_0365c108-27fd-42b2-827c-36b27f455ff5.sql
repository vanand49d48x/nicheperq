-- Enable realtime for tables used in subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_email_drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_enrollments;