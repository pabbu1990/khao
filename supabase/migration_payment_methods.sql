-- Run once in Supabase SQL Editor if your DB predates the per-method
-- payment toggles (Accept cash / Accept Interac).
alter table public.vendors add column if not exists accept_cash    boolean not null default true;
alter table public.vendors add column if not exists accept_interac boolean not null default true;
