# Khao — Product backlog

Single source of truth for what's next. Update **Status** as items move. Detailed specs live
in `/docs` and are linked below.

- **Status:** Backlog · Next up · In progress · Shipped
- **Effort:** S (~days) · M (~1 wk) · L (multi-week)
- **Tier:** Free (core) · Pro (paid)

---

## Recently shipped
- Item options / modifiers (spice level, sizes, add-ons) — Free — `docs/modifiers-spec.md`
- Pickup location on order confirmation — Free
- Pro-interest capture (Settings + homepage)
- Homepage redesign, marketing flyers & social assets

---

## Pro backlog (paid tier)

| # | Item | Tier | Effort | Depends on | Spec / notes | Status |
|---|------|------|--------|------------|--------------|--------|
| 0 | Vendor Pro billing (Stripe Billing) — Checkout + portal + webhook -> is_pro flag -> gate features. Enabler for all below. | Pro | S-M | — | Test-mode build needs no bank acct | Backlog |
| 1 | Cooking / prep plan — roll the day's orders into one make-list by dish AND option | Pro | M | — | Pairs with modifiers | Backlog |
| 2 | Packing labels / order slips — printable per-order label (name, items+options, pickup/delivery, phone) | Pro | S | — | Print view | Backlog |
| 3 | Analytics & insights — best sellers, busy days, repeat customers, revenue trends | Pro | M | — | — | Backlog |
| 4 | SMS & email confirmations — auto status msgs (confirmed->ready->delivered) + receipts | Pro | M | SMS provider | Email already exists | Backlog |
| 5 | Subscriptions / weekly plans — Phase 1 offline standing orders; Phase 2 recurring billing | Pro | L | #0 (Phase 2 -> Connect) | `docs/subscriptions-plan.md` | Backlog |
| 6 | Proof of delivery (POD) — mark Delivered + timestamp/photo; customer sees it | Pro | M | — | Delivery vendors | Backlog |
| 7 | Today's deliveries run — day's deliveries grouped by area + "Open in Maps" (not full routing) | Pro | M | — | — | Backlog |
| 8 | Online / card payments at checkout — pay vendor by card via Stripe Connect | Pro | L | #0, demand signal | Biggest; build when interest proven | Backlog |
| 9 | Custom branding — logo/colors, remove "Powered by Khao" | Pro | S | #0 | — | Backlog |
| 10 | Promo codes — discounts / repeat-customer offers | Pro | M | — | — | Backlog |
| 11 | Priority support | Pro | S | — | Ops, not code | Backlog |

**Suggested order:** 0 -> 1, 2 -> 3 -> 4 -> 5 -> 6, 7 -> 8 (when demand proven). Fold 9-11 in along the way.

---

## Guardrails — deliberately NOT building
Protect the "simple, free on-ramp" identity. Revisit only if the market forces it.
- Driver app / driver-status tracking
- True multi-stop route optimization / fleet management
- POS hardware integration
- Marketplace / customer accounts / reviews-for-discovery (only if Khao becomes a multi-kitchen marketplace)

---

## How we run this
- This file is the source of truth, versioned with the code. Add / re-order / retire items here.
- Each non-trivial item gets a short spec in `/docs` (like `modifiers-spec.md`, `subscriptions-plan.md`) before building.
- Optional visual board: mirror in GitHub Projects (ties to commits/PRs) or Notion / Trello for kanban.
- Triage cadence: re-rank after every vendor learning or ~every 2 weeks. Priority follows real demand (e.g., the Pro "I'm interested" taps), not novelty.
