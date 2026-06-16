-- ONE-TIME cleanup — run only if one owner accidentally created multiple kitchens.
-- WARNING: deleting a vendor cascades to its dishes, services and orders.
-- This keeps the EARLIEST kitchen per owner and deletes the rest. If the kitchen you
-- want to keep is NOT the earliest, delete the extras MANUALLY in the Table Editor instead.

delete from public.vendors a
using public.vendors b
where a.owner_id = b.owner_id
  and a.created_at > b.created_at;

-- Enforce one kitchen per owner going forward.
drop index if exists public.vendors_owner_idx;
create unique index vendors_owner_idx on public.vendors(owner_id);
