-- Add CRM fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS contact_status text DEFAULT 'new' CHECK (contact_status IN ('new', 'attempted', 'connected', 'in_conversation', 'active_partner', 'do_not_contact')),
ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_follow_up_at timestamp with time zone;

-- Create contact_notes table for tracking interactions
CREATE TABLE IF NOT EXISTS public.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contact_notes
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_notes
CREATE POLICY "Users can view own contact notes"
  ON public.contact_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contact notes"
  ON public.contact_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact notes"
  ON public.contact_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact notes"
  ON public.contact_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_notes_lead_id ON public.contact_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_user_id ON public.contact_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_contact_status ON public.leads(contact_status);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(next_follow_up_at);

-- Trigger for updating contact_notes updated_at
CREATE TRIGGER update_contact_notes_updated_at
  BEFORE UPDATE ON public.contact_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();