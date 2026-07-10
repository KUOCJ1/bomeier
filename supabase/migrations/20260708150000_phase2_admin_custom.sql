-- Bo Mei Er — Phase 2: Add admin role + custom_orders fields
-- 2026-07-08

-- Add role column to profiles (default 'user', admin manually set)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add notify_on_new_arrival to profiles for "到貨通知"
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_on_arrival BOOLEAN NOT NULL DEFAULT false;
