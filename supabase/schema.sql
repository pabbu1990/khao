-- Khao — database schema, RLS, triggers
-- Apply in Supabase: SQL Editor → paste → Run. (Or supabase db push.)

-- ---------- enums ----------
do $$ begin
  create type user_role     as enum ('vendor','admin');
  create type order_status  as enum ('placed','accepted','ready','completed','declined','cancelled');
  create type pay_method     as enum ('offline','online');
  create type pay_status     as enum ('unpaid','paid','refunded');
  create type fulfilment     as enum ('pickup','delivery');
exception when duplicate_object then null; end $$;

-- ---------- profiles (vendors + admins only) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'vendor',
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ---------- vendors (the tenant / kitchen) ----------
create table if not exists public.vendors (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references public.profiles(id) on delete cascade,
  slug                 text unique not null,
  name                 text not null,
  bio                  text,
  area                 text,
  hours                text,
  logo_url             text,
  accept_offline       boolean not null default true,
  accept_cash          boolean not null default true,
  accept_interac       boolean not null default true,
  offline_instructions text,
  accept_online        boolean not null default false,
  stripe_account_id    text,
  status               text not null default 'active',  -- active | suspended
  accepting_orders     boolean not null default true,
  created_at           timestamptz not null default now()
);
create index if not exists vendors_owner_idx on public.vendors(owner_id);

-- ---------- services (meal-time menus within a kitchen) ----------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  name            text not null,
  description     text,
  available_days  text[] not null default '{}',  -- empty = always (when active)
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists services_vendor_idx on public.services(vendor_id);

-- ---------- dishes ----------
create table if not exists public.dishes (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  service_id      uuid references public.services(id) on delete cascade,
  name            text not null,
  description     text,
  price_cad       numeric(10,2) not null check (price_cad >= 0),
  photo_url       text,
  veg             boolean not null default true,
  is_sold_out     boolean not null default false,
  is_active       boolean not null default true,
  available_days  text[] not null default '{}',
  cutoff_time     time,
  options         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists dishes_vendor_idx on public.dishes(vendor_id);

-- ---------- orders ----------
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references public.vendors(id) on delete cascade,
  customer_name         text not null,
  customer_phone        text not null,
  customer_email        text,
  customer_address      text,
  fulfilment            fulfilment not null default 'pickup',
  requested_time        text,
  customer_note         text,
  payment_method        pay_method not null default 'offline',
  payment_label         text,
  payment_status        pay_status not null default 'unpaid',
  status                order_status not null default 'placed',
  subtotal_cad          numeric(10,2) not null default 0,
  stripe_payment_intent text,
  created_at            timestamptz not null default now()
);
create index if not exists orders_vendor_idx on public.orders(vendor_id, created_at desc);

-- ---------- order_items ----------
create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  dish_id         uuid references public.dishes(id) on delete set null,
  name_snapshot   text not null,
  service_snapshot text,
  price_snapshot  numeric(10,2) not null,
  qty             integer not null check (qty > 0),
  options_snapshot jsonb
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- reviews (basic; surfaced later) ----------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  order_id    uuid references public.orders(id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

-- ---------- helper: is the current user an admin? ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------- auto-create a profile on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'vendor', coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================= RLS =================
alter table public.profiles    enable row level security;
alter table public.vendors     enable row level security;
alter table public.services    enable row level security;
alter table public.dishes      enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;

-- profiles: a user sees their own; admin sees all
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid());

-- vendors: public can read ACTIVE kitchens (storefront); owner & admin full
drop policy if exists vendors_public_read on public.vendors;
create policy vendors_public_read on public.vendors
  for select using (status = 'active' or owner_id = auth.uid() or public.is_admin());
drop policy if exists vendors_owner_write on public.vendors;
create policy vendors_owner_write on public.vendors
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- services: public reads active services; owner & admin full
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

-- dishes: public reads active dishes of active vendors; owner & admin full
drop policy if exists dishes_public_read on public.dishes;
create policy dishes_public_read on public.dishes
  for select using (
    is_active = true
    or exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin()))
  );
drop policy if exists dishes_owner_write on public.dishes;
create policy dishes_owner_write on public.dishes
  for all using (exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin())));

-- orders: ANYONE can place (insert); only the owning vendor + admin can read/update
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders
  for insert with check (true);
drop policy if exists orders_vendor_read on public.orders;
create policy orders_vendor_read on public.orders
  for select using (exists (select 1 from public.vendors v where v.id = vendor_id and (v.owner_id = auth.uid() or public.is_admin())));
drop policy if exists orders_vendor_update on public.orders;
create policy orders_vendor_update on public.orders
  for update using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

-- order_items: anyone can insert (with their order); vendor + admin read
drop policy if exists order_items_public_insert on public.order_items;
create policy order_items_public_insert on public.order_items
  for insert with check (true);
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select using (exists (
    select 1 from public.orders o join public.vendors v on v.id = o.vendor_id
    where o.id = order_id and (v.owner_id = auth.uid() or public.is_admin())));

-- reviews: public read; public insert
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (true);
drop policy if exists reviews_public_insert on public.reviews;
create policy reviews_public_insert on public.reviews for insert with check (true);

-- realtime: include orders so the dashboard updates live
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.dishes;
alter publication supabase_realtime add table public.services;
alter publication supabase_realtime add table public.vendors;
