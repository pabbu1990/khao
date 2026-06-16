-- Khao — storage bucket for dish photos.
-- Run once in Supabase SQL Editor (after schema.sql).

-- Public bucket so dish photos can be shown on the storefront without auth.
insert into storage.buckets (id, name, public)
values ('dish-photos', 'dish-photos', true)
on conflict (id) do nothing;

-- Anyone can VIEW dish photos (public storefront).
drop policy if exists "dish photos public read" on storage.objects;
create policy "dish photos public read" on storage.objects
  for select to public
  using (bucket_id = 'dish-photos');

-- Signed-in vendors can UPLOAD into the bucket.
drop policy if exists "dish photos vendor upload" on storage.objects;
create policy "dish photos vendor upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dish-photos');

-- Signed-in vendors can replace / remove photos they manage.
drop policy if exists "dish photos vendor update" on storage.objects;
create policy "dish photos vendor update" on storage.objects
  for update to authenticated
  using (bucket_id = 'dish-photos');

drop policy if exists "dish photos vendor delete" on storage.objects;
create policy "dish photos vendor delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dish-photos');
