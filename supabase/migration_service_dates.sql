-- Run once in Supabase SQL Editor: services can list multiple dates.
alter table public.services add column if not exists service_dates date[] not null default '{}';
