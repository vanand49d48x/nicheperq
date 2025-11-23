-- Create table for AI chat messages
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own chat messages"
  ON public.ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at DESC);