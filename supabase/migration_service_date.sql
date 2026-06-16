-- Run once in Supabase SQL Editor: add a date to services (which day the service is for).
alter table public.services add column if not exists service_date date;
