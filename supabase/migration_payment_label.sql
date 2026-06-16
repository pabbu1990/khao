-- Run once in Supabase SQL Editor if your DB was created before the
-- cash/Interac payment choice was added.
alter table public.orders add column if not exists payment_label text;
