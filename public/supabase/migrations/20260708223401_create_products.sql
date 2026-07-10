-- Bo Mei Er — Phase 3: Add products table with inventory tracking

CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  material TEXT DEFAULT '',
  feature TEXT DEFAULT '',
  style TEXT DEFAULT '',
  style_profile TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '上架' CHECK (status IN ('上架', '下架', '已售出', '試作中', '即將上架')),
  description TEXT DEFAULT '',
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  date_added DATE DEFAULT CURRENT_DATE,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to products"
  ON public.products FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Everyone can view non-sold, published products
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (status IN ('上架', '即將上架'));
