# Khao smoke tests

Two layers, both **fully isolated** from the app code (nothing here changes how
the app builds or runs — it's all in `tests/` and `scripts/`, excluded from the
Next build).

## 1. Read-only health check (safe on production)
Verifies the live site, Supabase connectivity, RLS safety, and a known storefront.
Makes **no writes** — safe to run against thekhao.com anytime.

```bash
cp tests/.env.health.example .env.local   # fill in values
npm run smoke:health
```
Checks: site/robots/sitemap load, unknown slug → 404, a known storefront renders,
anon can read active vendors/dishes, and **orders are NOT readable by anon** (RLS).

## 2. Full E2E suite (vendor + customer flows)
Drives the real browser through: auth (login + wrong password), new-vendor
onboarding, returning vendor, single / multi / big menus, sold-out, settings,
customer order placement (single + multi menu), order lifecycle (complete,
decline, reopen), and edge cases (paused kitchen, $0 dish).

### One-time setup — a FREE test project (so prod is never touched)
1. In Supabase, create a **new organization on the Free plan**, then a **project**
   inside it. (Free projects are $0 — your Pro plan is unaffected. Do NOT add a
   2nd project inside your Pro org; that one costs +$10/mo.)
2. Apply your schema to the test project: run your migrations / SQL so it has the
   same tables, RLS policies, and the `dish-photos` storage bucket as prod.
3. Test project → Authentication → Providers → Email: **turn OFF "Confirm email"**
   (lets the onboarding/signup tests run without an inbox).
4. `cp tests/.env.test.example tests/.env.test` and fill in the TEST project's
   URL, anon key, and **service-role** key.

### Run
```bash
npm install                 # installs @playwright/test (dev only)
npm run smoke:install       # one-time: download the Chromium browser
# In one terminal — run the app against the TEST env:
#   (load tests/.env.test into your dev environment, then) npm run dev
npm run smoke               # in another terminal
```

Notes:
- All test data is namespaced (`smoke-*` slugs, `*@smoke.test` users) and removed
  automatically in global teardown — nothing is left behind.
- Selectors are based on the current UI text; if the UI copy changes, a couple of
  `getByRole`/`getByText` selectors may need a quick update. Run with
  `npx playwright test --headed --debug` to step through failures.
- NEVER put production keys in `tests/.env.test`.
