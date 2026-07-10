-- Bo Mei Er — Shopping Cart table (Phase 3)
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- Users can read/insert/update/delete their own cart items
CREATE POLICY "Users manage own cart"
  ON public.shopping_cart FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
