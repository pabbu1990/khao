# Khao — database setup & migrations

Run these in the Supabase **SQL Editor** (Dashboard → SQL Editor → paste → Run).
Files are numbered in the exact order they must run.

## Fresh project (new Supabase database)
`00_schema.sql` already contains the full, up-to-date schema, so you only need:

1. `00_schema.sql` — tables, row-level security, triggers, realtime
2. `01_storage.sql` — `dish-photos` storage bucket + policies

That's it. (You can also run `seed.sql` for optional sample data.)

## Upgrading a database created earlier
Run any numbered files you haven't applied yet, **in order**. They're written to be
safe to re-run (`add column if not exists`, `create … if not exists`, idempotent DO blocks),
so running one that's already applied is a harmless no-op.

| # | File | What it adds |
|---|------|--------------|
| 00 | `00_schema.sql` | Base schema: profiles, vendors, services, dishes, orders, order_items, reviews, RLS, triggers |
| 01 | `01_storage.sql` | `dish-photos` storage bucket + access policies |
| 02 | `02_payment_label.sql` | `orders.payment_label` (Cash on pickup / Interac, etc.) |
| 03 | `03_payment_methods.sql` | `vendors.accept_cash`, `vendors.accept_interac` |
| 04 | `04_services.sql` | `services` table + `dishes.service_id` + `order_items.service_snapshot` |
| 05 | `05_realtime.sql` | Adds `dishes`, `services`, `vendors` to the realtime feed |
| 06 | `06_service_date.sql` | `services.service_date` (single date — superseded by 07) |
| 07 | `07_service_dates.sql` | `services.service_dates` (multiple dates) |
| 08 | `08_vendor_dedup.sql` | One-time cleanup of duplicate kitchens + unique index on `vendors.owner_id` |

## Notes
- **05 must come after 04** (realtime references the `services` table).
- **06 and 07 must come after 04** (they alter the `services` table). 07 supersedes 06; both columns can coexist.
- **08 deletes data** (duplicate kitchens cascade to their dishes/services/orders) — read the warning at the top of the file before running. Skip it if you don't have duplicates.
- `seed.sql` is optional placeholder data; not part of the migration sequence.
