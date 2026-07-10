-- Bo Mei Er — Phase 4: Admin journal posts management

CREATE TABLE IF NOT EXISTS public.journal_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to journal posts"
  ON public.journal_posts FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  );

CREATE POLICY "Anyone can view published journal posts"
  ON public.journal_posts FOR SELECT
  USING (status = 'published');
