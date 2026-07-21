-- Bo Mei Er — Admin roles and permission policies
-- 2026-07-21

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'editor', 'fulfillment', 'admin', 'owner'));

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'user'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_actor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_profile_role() IN ('owner', 'admin')
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) IN ('kuocj1@gmail.com', 'bomei.cheng1116@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_orders()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_profile_role() IN ('owner', 'admin', 'fulfillment')
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) IN ('kuocj1@gmail.com', 'bomei.cheng1116@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_profile_role() IN ('owner', 'admin', 'editor')
    OR lower(COALESCE(auth.jwt() ->> 'email', '')) IN ('kuocj1@gmail.com', 'bomei.cheng1116@gmail.com');
$$;

-- Profiles: users can still manage their own profile; admin actors can review and assign roles.
DROP POLICY IF EXISTS "Admin actors can view profiles" ON public.profiles;
CREATE POLICY "Admin actors can view profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin_actor());

DROP POLICY IF EXISTS "Admin actors can update profile roles" ON public.profiles;
CREATE POLICY "Admin actors can update profile roles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin_actor())
  WITH CHECK (public.is_admin_actor());

-- Orders: customers see their own records; order managers can operate the full queue.
DROP POLICY IF EXISTS "Order managers can view all orders" ON public.orders;
CREATE POLICY "Order managers can view all orders"
  ON public.orders FOR SELECT
  USING (public.can_manage_orders());

DROP POLICY IF EXISTS "Order managers can update orders" ON public.orders;
CREATE POLICY "Order managers can update orders"
  ON public.orders FOR UPDATE
  USING (public.can_manage_orders())
  WITH CHECK (public.can_manage_orders());

DROP POLICY IF EXISTS "Order managers can view all custom orders" ON public.custom_orders;
CREATE POLICY "Order managers can view all custom orders"
  ON public.custom_orders FOR SELECT
  USING (public.can_manage_orders());

DROP POLICY IF EXISTS "Order managers can update custom orders" ON public.custom_orders;
CREATE POLICY "Order managers can update custom orders"
  ON public.custom_orders FOR UPDATE
  USING (public.can_manage_orders())
  WITH CHECK (public.can_manage_orders());

-- Content tables: keep public reads where already defined; restrict write operations by role.
DROP POLICY IF EXISTS "Content managers can manage products" ON public.products;
CREATE POLICY "Content managers can manage products"
  ON public.products FOR ALL
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS "Content managers can manage custom options" ON public.custom_options;
CREATE POLICY "Content managers can manage custom options"
  ON public.custom_options FOR ALL
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS "Content managers can manage custom page settings" ON public.custom_page_settings;
CREATE POLICY "Content managers can manage custom page settings"
  ON public.custom_page_settings FOR ALL
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS "Content managers can manage journal posts" ON public.journal_posts;
CREATE POLICY "Content managers can manage journal posts"
  ON public.journal_posts FOR ALL
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());
