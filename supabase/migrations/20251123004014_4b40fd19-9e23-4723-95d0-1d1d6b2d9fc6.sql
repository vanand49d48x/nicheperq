-- Create knowledge_base_categories table
CREATE TABLE public.knowledge_base_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_base_articles table
CREATE TABLE public.knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES public.knowledge_base_categories(id) ON DELETE SET NULL,
  tags TEXT[],
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.knowledge_base_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Anyone can view published categories"
  ON public.knowledge_base_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.knowledge_base_categories FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for articles
CREATE POLICY "Anyone can view published articles"
  ON public.knowledge_base_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all articles"
  ON public.knowledge_base_articles FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create articles"
  ON public.knowledge_base_articles FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update articles"
  ON public.knowledge_base_articles FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete articles"
  ON public.knowledge_base_articles FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_kb_articles_updated_at
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_kb_articles_category_id ON public.knowledge_base_articles(category_id);
CREATE INDEX idx_kb_articles_published ON public.knowledge_base_articles(is_published);
CREATE INDEX idx_kb_articles_tags ON public.knowledge_base_articles USING GIN(tags);
CREATE INDEX idx_kb_categories_slug ON public.knowledge_base_categories(slug);
CREATE INDEX idx_kb_articles_slug ON public.knowledge_base_articles(slug);

-- Insert default categories
INSERT INTO public.knowledge_base_categories (name, slug, description, icon, display_order) VALUES
  ('Getting Started', 'getting-started', 'Learn the basics of NichePerQ', 'Rocket', 1),
  ('Billing & Plans', 'billing-plans', 'Questions about pricing, payments, and subscriptions', 'CreditCard', 2),
  ('Lead Generation', 'lead-generation', 'How to find and manage leads effectively', 'Users', 3),
  ('CRM Features', 'crm-features', 'Using the CRM pipeline and contact management', 'Briefcase', 4),
  ('AI Tools', 'ai-tools', 'Understanding and using AI-powered features', 'Sparkles', 5),
  ('Troubleshooting', 'troubleshooting', 'Common issues and how to resolve them', 'AlertCircle', 6);