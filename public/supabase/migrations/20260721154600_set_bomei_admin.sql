-- Bo Mei Er — Grant admin role to Bomei account
-- 2026-07-21

UPDATE public.profiles
SET role = 'admin',
    updated_at = NOW()
WHERE id IN (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'bomei.cheng1116@gmail.com'
);
