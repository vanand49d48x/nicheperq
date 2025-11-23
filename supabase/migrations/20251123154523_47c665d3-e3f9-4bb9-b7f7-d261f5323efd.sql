-- Add AI fields to contact_notes table
ALTER TABLE public.contact_notes
ADD COLUMN note_type TEXT CHECK (note_type IN ('manual', 'ai_generated', 'email_summary', 'call_summary')) DEFAULT 'manual',
ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative'));

-- Create lead_interactions table for tracking all lead activities
CREATE TABLE public.lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email_sent', 'email_opened', 'email_clicked', 'email_replied', 'call', 'meeting', 'note_added', 'status_changed')),
  metadata JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for lead_interactions
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_interactions
CREATE POLICY "Users can view own lead interactions"
ON public.lead_interactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead interactions"
ON public.lead_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_user_id ON public.lead_interactions(user_id);
CREATE INDEX idx_lead_interactions_occurred_at ON public.lead_interactions(occurred_at DESC);