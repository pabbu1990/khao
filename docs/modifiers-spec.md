# Khao — Item options & modifiers (spec)

_Status: design / awaiting confirmation_

## Goal
Let a dish carry customizations (spice level, size, add-ons) so customers order exactly what
they want and the kitchen gets the right ticket. Improves order accuracy and average order
value. Free / core tier.

## Data model (no new tables — reuse existing jsonb columns)
- `dishes.options` (jsonb, exists) — array of option groups:
  `{ id, name, type: "single" | "multi", required: boolean, max?: number,
     choices: [{ id, label, price }] }`
  `price` = CAD delta (0 for spice level, +1.00 for extra roti, etc.).
- `order_items.options_snapshot` (jsonb, exists) — the customer's exact selections at order
  time: `[{ group, label, price }]`. Frozen, so history stays correct if the vendor later
  edits options.
- `order_items.price_snapshot` (exists) — line price = base + selected deltas.

## Vendor UX (Add / Edit dish screen)
"Options" section: **+ Add option group** -> name ("Spice level"), pick **Choose one** or
**Choose many**, toggle **Required**, add choices (label + optional price). Reorder / delete.
Most kitchens use 0-2 groups.

## Customer UX (storefront)
Tapping a dish with options opens an **add-to-order sheet**: radios (choose-one) or checkboxes
(choose-many) with price deltas; the **"Add to order - $X"** button updates live; required
groups must be chosen, `max` enforced for multi. Dishes with no options keep the one-tap `+`
(no regression). Cart line shows selections ("Butter chicken - Medium, Extra roti").

## Order capture & display
`placeOrder` writes selections to `options_snapshot` + computed `price_snapshot`. Selections
render in: vendor dashboard / prep list, report / CSV, customer confirmation.

## Pricing
Line total = (dish base + sum of selected choice deltas) x quantity. Subtotal sums lines.

## Validation / edge cases
- Required group blocks "Add" until chosen.
- Multi enforces `max`.
- Editing a dish's options never changes past orders (snapshot).
- Dish-level sold-out still applies; per-choice availability is a later nicety.

## Scope
- **v1 (this build):** vendor define groups/choices; customer select sheet (live price +
  validation); capture + display across dashboard, report, confirmation.
- **Later:** per-choice sold-out, default selections, copy options between dishes, templates.

## Build sequence
1. Types + helpers for the options shape.
2. Vendor editor in the dish form + save action.
3. Customer add-to-order sheet in `Storefront`.
4. `placeOrder` + snapshots.
5. Render selections in dashboard / report / confirmation.
6. Verify build / types.

## Notes
- No DB migration needed (`options` and `options_snapshot` jsonb already exist).
- Keep it free/core — it's an ordering-quality improvement, not a Pro feature.
