-- Bo Mei Er manual repair: custom option tables only.
-- This intentionally does not update product visibility or product records.

CREATE TABLE IF NOT EXISTS public.custom_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group TEXT NOT NULL CHECK (option_group IN ('style', 'metal', 'length', 'type')),
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(option_group, code)
);

CREATE TABLE IF NOT EXISTS public.custom_page_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active custom options" ON public.custom_options;
DROP POLICY IF EXISTS "Admin full access to custom options" ON public.custom_options;
DROP POLICY IF EXISTS "Anyone can view custom page settings" ON public.custom_page_settings;
DROP POLICY IF EXISTS "Admin full access to custom page settings" ON public.custom_page_settings;

CREATE POLICY "Anyone can view active custom options"
  ON public.custom_options FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin full access to custom options"
  ON public.custom_options FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  );

CREATE POLICY "Anyone can view custom page settings"
  ON public.custom_page_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin full access to custom page settings"
  ON public.custom_page_settings FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'kuocj1@gmail.com'
  );

INSERT INTO public.custom_options
  (option_group, code, label, description, image_url, metadata, sort_order, is_active)
VALUES
  ('style', 'romantic_rose', '浪漫復古', '玫瑰金與粉色珠串，偏送禮與約會感。', 'images/products/style-scenes/romantic-rose-ai.webp', '{"scene":"送禮 / 約會 / 柔和穿搭","wear":"奶茶色、白色、針織、洋裝","feel":"柔和暖調","productName":"杏花微雨","accent":"#D4A574","colorLabel":"玫瑰金、粉嫩色系"}'::jsonb, 10, TRUE),
  ('style', 'clear_pastel', '清透日常', '透明感高、日常通勤最安全。', 'images/products/style-scenes/clear-pastel-ai.webp', '{"scene":"通勤 / 百搭 / 透明殼","wear":"白襯衫、牛仔、淺色休閒穿搭","feel":"極簡通勤","productName":"晨露琉璃","accent":"#A8D8EA","colorLabel":"透明、淺色系"}'::jsonb, 20, TRUE),
  ('style', 'porcelain_blue', '霧藍瓷感', '藍灰調與冷感質地，安靜耐看。', 'images/products/style-scenes/porcelain-blue-ai.webp', '{"scene":"冷調 / 安靜 / 質感穿搭","wear":"灰藍、黑白、銀色配件","feel":"靜謐質感","productName":"霧藍水滴","accent":"#8FB8C9","colorLabel":"藍灰色調、霧感珠串"}'::jsonb, 30, TRUE),
  ('style', 'sage_natural', '自然清新', '大地色與植物感，放鬆好搭配。', 'images/products/style-scenes/sage-natural-ai.webp', '{"scene":"日常 / 旅行 / 大地色","wear":"亞麻、卡其、米白、棉麻穿搭","feel":"自然系","productName":"森林綠琉璃","accent":"#7BAE7F","colorLabel":"大地色、植物感"}'::jsonb, 40, TRUE),
  ('style', 'midnight_luxury', '午夜精品', '深色與金屬光澤，低調但有份量。', 'images/products/style-scenes/midnight-luxury-ai.webp', '{"scene":"夜晚 / 低調 / 金屬感","wear":"黑色、深藍、金屬飾品、俐落穿搭","feel":"高級夜色","productName":"曜石黑金","accent":"#0A1628","colorLabel":"深色背景、金屬光澤"}'::jsonb, 50, TRUE),
  ('metal', 'rose_gold', '玫瑰金', '柔和、帶暖度，適合浪漫或送禮風格。', '', '{"emoji":"RG"}'::jsonb, 10, TRUE),
  ('metal', 'warm_gold', '暖金色', '更明亮、有存在感，適合偏精品或華麗感。', '', '{"emoji":"G"}'::jsonb, 20, TRUE),
  ('metal', 'silver', '銀色', '乾淨俐落，適合冷色系與日常風格。', '', '{"emoji":"S"}'::jsonb, 30, TRUE),
  ('metal', 'black', '黑色', '低調俐落，適合深色、個性或中性風格。', '', '{"emoji":"BK"}'::jsonb, 40, TRUE),
  ('length', 'choker', '短鏈（約 30cm）', '更貼近手機或包包，視覺集中。', '', '{"emoji":"30"}'::jsonb, 10, TRUE),
  ('length', 'medium', '中鏈（約 45cm）', '最安全的日常長度，手拿與掛包都順。', '', '{"emoji":"45"}'::jsonb, 20, TRUE),
  ('length', 'long', '長鏈（約 60cm）', '更有垂墜感，適合想讓配件更顯眼。', '', '{"emoji":"60"}'::jsonb, 30, TRUE),
  ('length', 'custom_length', '客製長度', '如果你有明確尺寸，我們照你的需求做。', '', '{"emoji":"cm"}'::jsonb, 40, TRUE),
  ('type', 'phone_strap', '手機鏈', '最主要的使用情境，適合日常拿取手機。', '', '{"emoji":"手機"}'::jsonb, 10, TRUE),
  ('type', 'earrings', '耳環', '輕量、精緻，適合成套搭配。', '', '{"emoji":"耳"}'::jsonb, 20, TRUE),
  ('type', 'bracelet', '手鍊', '做成手腕上的小亮點。', '', '{"emoji":"手"}'::jsonb, 30, TRUE),
  ('type', 'necklace', '項鍊', '讓琉璃主珠成為穿搭焦點。', '', '{"emoji":"項"}'::jsonb, 40, TRUE),
  ('type', 'keychain', '鑰匙圈', '實用、好送禮，也適合包包掛飾。', '', '{"emoji":"鑰"}'::jsonb, 50, TRUE),
  ('type', 'other', '其他', '有特殊想法可以先描述，我們再討論可行性。', '', '{"emoji":"+"}'::jsonb, 60, TRUE)
ON CONFLICT (option_group, code) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  metadata = EXCLUDED.metadata,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO public.custom_page_settings (key, value)
VALUES
  ('custom_page', '{
    "heroTitle":"把一條手機鏈做成你的風格",
    "heroSubtitle":"先選風格，再補一句需求；我們會依照你喜歡的氛圍、材質與使用情境討論細節。",
    "referenceHelp":"可以上傳穿搭、手機殼或你喜歡的配色參考圖。",
    "descriptionPlaceholder":"例如：想要低調一點、偏銀色、適合白色手機殼，或希望有一點送禮感。",
    "submitLabel":"送出客製需求",
    "successTitle":"客製需求已送出",
    "successBody":"我們會依照你的選項與補充內容，再接續確認細節。"
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

NOTIFY pgrst, 'reload schema';
