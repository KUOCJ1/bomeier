-- Bo Mei Er — Hide legacy HOLA-background product batch from public storefront

UPDATE public.products
SET
  status = '下架',
  updated_at = NOW()
WHERE sku LIKE 'BM-T%';

UPDATE public.custom_options
SET
  image_url = CASE code
    WHEN 'romantic_rose' THEN 'images/products/style-scenes/romantic-rose-ai.webp'
    WHEN 'clear_pastel' THEN 'images/products/style-scenes/clear-pastel-ai.webp'
    WHEN 'porcelain_blue' THEN 'images/products/style-scenes/porcelain-blue-ai.webp'
    WHEN 'sage_natural' THEN 'images/products/style-scenes/sage-natural-ai.webp'
    WHEN 'midnight_luxury' THEN 'images/products/style-scenes/midnight-luxury-ai.webp'
    ELSE image_url
  END,
  metadata = CASE code
    WHEN 'romantic_rose' THEN metadata || '{"productName":"杏花微雨"}'::jsonb
    WHEN 'clear_pastel' THEN metadata || '{"productName":"晨露琉璃"}'::jsonb
    WHEN 'porcelain_blue' THEN metadata || '{"productName":"霧藍水滴"}'::jsonb
    WHEN 'sage_natural' THEN metadata || '{"productName":"森林綠琉璃"}'::jsonb
    WHEN 'midnight_luxury' THEN metadata || '{"productName":"曜石黑金"}'::jsonb
    ELSE metadata
  END,
  updated_at = NOW()
WHERE option_group = 'style'
  AND code IN ('romantic_rose', 'clear_pastel', 'porcelain_blue', 'sage_natural', 'midnight_luxury');
