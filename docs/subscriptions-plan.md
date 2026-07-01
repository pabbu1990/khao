# Khao — Subscriptions service (build plan)

_Status: planning · Owner: Khao team_

## Goal
Let a kitchen offer recurring **weekly meal plans** (the tiffin model) so customers set it
up once and reorder automatically. Gives the vendor **predictable demand** and less order
chasing; gives Khao a strong **Pro / retention** hook.

## The core decision: billing
Khao does not process payments today (cash / Interac, collected by the vendor). So
subscriptions split into two phases.

### Phase 1 — "Standing weekly order" (build now, no card billing)
A subscription is a recurring **commitment**, not an auto-charge. Each cycle Khao generates
that week's order(s) for the vendor; the vendor cooks and collects payment offline as today.

- **Vendor** creates a plan (name e.g. "Weekly Tiffin", cadence = weekly, delivery day,
  price per week or per meal, what's included / meal count, pickup or delivery). Sees a
  **Subscribers** list and a **"This week's subscription orders"** prep list. Can
  pause / cancel a subscriber.
- **Customer (storefront)** taps Subscribe -> picks the plan, enters name / phone / (email) /
  address, pickup or delivery, start date, notes -> confirmation. Gets a manage link to
  pause / cancel.
- **Generation:** each week the active subscriptions become real orders on the delivery day,
  flowing into the existing Orders dashboard (flagged "Subscription"). Vendor accepts / marks
  ready / paid exactly like a normal order. Mechanism: a weekly scheduled job (Vercel Cron)
  + a manual "Generate this week" fallback.
- **Value even without auto-pay:** predictable order volume, auto-built prep list, no weekly
  re-ordering friction for the customer.

### Phase 2 — Real recurring billing (Pro + Stripe)
- Stripe subscription per customer, auto-charged each cycle; customer self-serve
  pause / skip / cancel; failed-payment handling. Truly hands-off, and a clear paid Pro
  feature. Depends on the Stripe billing work.

## Data model (Phase 1)
- **plans** — id, vendor_id, name, cadence ('weekly'), delivery_day, price_cad,
  meals_count / description, fulfilment, is_active.
- **subscriptions** — id, vendor_id, plan_id, customer_name / phone / email / address,
  fulfilment, status ('active' | 'paused' | 'cancelled'), start_date, note, manage_token,
  created_at.
- Generated weekly orders **reuse the existing `orders` table** with `subscription_id` + a
  flag, so the dashboard, reports, and payment flow all work unchanged.

## Scope / sequence (Phase 1)
1. DB tables + RLS + types.
2. Vendor: create / manage plans (new "Plans" area, under Menu or its own page).
3. Storefront: "Subscribe" entry + subscribe form + confirmation.
4. Vendor: Subscribers list + this-week generation + pause / cancel.
5. Weekly generation job (cron) + manual fallback.
6. Customer manage link (pause / cancel).

Estimated a few focused build sessions — the largest feature scoped so far. Build in the
order above so each piece is shippable.

## Open questions (shape the build)
1. **Plan shape** — fixed tiers (Starter / Plus / Standard) or one flexible weekly plan with
   a quantity? _Recommendation: one flexible weekly plan per kitchen to start._
2. **Weekly menu** — customer picks dishes each week, or just gets "the plan" (vendor
   decides)? _Recommendation: vendor decides (simpler, matches most tiffins)._
3. **Payment in Phase 1** — confirm offline only (vendor collects weekly) until Stripe ships.
4. **Gating** — locked Pro teaser now, or ship Phase 1 free during early access and turn on
   billing with Pro later? _Recommendation: ship Phase 1 free during early access._

## Recommendation
Phase 1: **one flexible weekly plan, vendor-decides-the-menu, offline payment, free during
early access.** Then layer Stripe recurring billing as the Pro upgrade (Phase 2).

## Dependencies / notes
- Phase 2 depends on the Stripe billing work (vendor Pro subscription is a separate but
  related Stripe effort).
- Reviews were intentionally deferred to a future **marketplace** phase (multi-kitchen
  discovery), not part of subscriptions.
