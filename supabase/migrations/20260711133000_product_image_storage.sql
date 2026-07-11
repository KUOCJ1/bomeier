-- Bo Mei Er — Product image storage and public product status sync

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin insert product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;

CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin insert product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
      OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
    )
  );

CREATE POLICY "Admin update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
      OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
      OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
    )
  );

CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
      OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;

CREATE POLICY "Anyone can view products for public catalog"
  ON public.products FOR SELECT
  USING (true);
