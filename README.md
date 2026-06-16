# Khao

Per-vendor online ordering for home kitchens. Each kitchen gets its own page
(`/your-kitchen`) to share in WhatsApp; customers order without an account, and
orders land on the vendor's live dashboard. Money never flows through Khao —
vendors take payment directly (online card payments route to the vendor's own
Stripe account, added in a later milestone).

## Stack
Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + Realtime + Storage). Deploy on Vercel.

## Surfaces
- **Customer storefront** — `/[slug]` (public, no login): menu, cart, guest checkout, order status.
- **Vendor dashboard** — `/dashboard` (login): realtime orders, prep list, day total, menu CRUD, settings.
- **Admin** — `/admin` (login, admin role): all kitchens, drill into any vendor, suspend/reactivate.

## Local setup
1. **Create a Supabase project** (free tier). In *SQL Editor*, paste and run `supabase/schema.sql`, then run `supabase/storage.sql` (creates the `dish-photos` bucket used for dish image uploads).
   - *Upgrading an existing DB?* Run the `supabase/migration_*.sql` files you haven't applied yet (payment label, payment methods, services).
2. **Auth**: in Supabase → Authentication → Providers, enable **Email** (magic link) and **Google** (add OAuth credentials). Set the Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` as a redirect URL.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API — keep secret; server only)
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
4. `npm install` then `npm run dev` → open http://localhost:3000.

## First run
- Sign in at `/login` → you'll be prompted to create your kitchen → add dishes in **Menu**.
- Visit `/your-slug` to see the customer storefront and place a test order.
- The order appears instantly on `/dashboard` (realtime).

### Make yourself admin
In Supabase → Table editor → `profiles`, set your row's `role` to `admin`. Then visit `/admin`.

## Deploy (Vercel)
1. Push this repo to GitHub.
2. Import into Vercel; add the same env vars (use your production `NEXT_PUBLIC_SITE_URL`, e.g. `https://khao.app`).
3. In Supabase Auth settings, add your production URL + `/auth/callback` redirect.
4. Deploy. Auto-deploys on every push.

## Roadmap (not yet built)
- **M4**: Stripe Connect online-payment path; email notifications (per-order + daily digest); photo uploads to Supabase Storage; PWA push.
- **Later**: discovery directory across vendors (the marketplace), subscriptions/tiffin plans, vendor billing.

## Notes
- Customers are guests — no accounts. Their details live on the order.
- Row-Level Security ensures a vendor can only ever see their own data; the public can read active menus and place orders but cannot read others' orders.
- `payment_method = online` currently records the intent; the Stripe checkout itself lands in M4.
