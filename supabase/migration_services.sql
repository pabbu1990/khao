-- Run once in Supabase SQL Editor to add multi-service support to an existing DB.

create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  name            text not null,
  description     text,
  available_days  text[] not null default '{}',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists services_vendor_idx on public.services(vendor_id);

alter table public.dishes      add column if not exists service_id uuid references public.services(id) on delete cascade;
alter table public.order_items add column if not exists service_snapshot text;

alter table public.services enable row level security;

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select using (
    is_active = true
    or exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin()))
  );

drop policy if exists services_owner_write on public.services;
create policy services_owner_write on public.services
  for all using (exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin())));
