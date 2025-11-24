-- Create email_accounts table for workspace-specific email configurations
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  
  -- SMTP fields (for custom SMTP)
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password_enc TEXT, -- encrypted password
  
  -- OAuth fields (for Gmail/Outlook)
  oauth_access_token_enc TEXT, -- encrypted access token
  oauth_refresh_token_enc TEXT, -- encrypted refresh token
  oauth_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and metadata
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own email accounts
CREATE POLICY "Users can view own email accounts"
  ON public.email_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON public.email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON public.email_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON public.email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_email_accounts_user_id ON public.email_accounts(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();