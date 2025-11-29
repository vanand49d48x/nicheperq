-- Enable realtime for ticket_replies table to support live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_replies;