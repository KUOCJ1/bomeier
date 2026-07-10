-- Bo Mei Er — Allow trial products (試作中) to be visible on website
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (status IN ('上架', '即將上架', '試作中'));
