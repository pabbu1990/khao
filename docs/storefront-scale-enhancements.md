# Storefront scaling enhancements (future — NOT for launch)

Notes + design decisions for when a vendor's menu grows large enough to need
better navigation. Exploratory. Do **not** build before the launch weekend — it
touches the critical customer path and the launch vendors have tiny menus, so
there is zero current benefit and real regression risk.

## The problem
Today's customer storefront is one long vertical list of full-width dish cards
grouped by menu. Great for small menus. But at **3+ menus × 10+ items** it
becomes a very long scroll with no way to jump between menus, no search, and no
sense of where you are.

## Proposed enhancements (priority order)
1. **Sticky menu nav (jump tabs + scrollspy)** — the big one. A horizontal,
   scrollable row of menu names pinned under the header. Tapping a menu scrolls
   to that section; the active tab tracks the section you're currently viewing.
2. **Search** — a field that filters dishes by name across ALL menus at once.
   Reuse the exact client-side filter logic already written for the Report page.
3. **Sticky section headers + slightly more compact rows** — the menu name
   sticks as you scroll; trim the dish photo from 96px to ~56px so more dishes
   fit per screen without losing the appetizing feel.

**Do NOT** collapse menus for customers (unlike the vendor menu page). Hiding
dishes behind a tap hurts discovery and sales. Jump-nav + search are the right
tools, not collapsing.

## Key behaviour decision: tabs = navigation, not a filter
Recommended model is **jump-nav (scrollspy)**:
- All menus stay on one continuous page.
- Tapping a tab scrolls to that menu; it does NOT hide the others.
- The highlighted tab reflects current scroll position.
- Therefore other menus (e.g. Weekday Lunch) correctly remain below when a
  different tab is active — that is intended, not a bug.

Alternative = **filter tabs** (tapping a tab shows only that menu, hides the
rest). Cleaner single-menu focus but worse cross-menu discovery and harder to
order across menus into one cart. Only use if a kitchen's menus are mutually
exclusive. (Not recommended by default.)

## Gating (keep small kitchens simple)
Only switch on the sticky tabs + search once a kitchen crosses a threshold
(suggested: **15+ dishes or 3+ menus**). Below that, keep the current spacious
single-list layout. Best of both: Sam's 2-item menu stays clean; a 50-item
operator stays navigable.

## Implementation notes for later
- Search: reuse Report's in-memory filter (name/desc), instant, no reload.
- Scrollspy: IntersectionObserver on each section; set the active tab on
  intersection. Smooth-scroll to a section must offset for the sticky header
  height. **Test iOS Safari sticky behaviour specifically** — it's the quirkiest.
- The write path (cart, placeOrder) is unchanged; this is presentation only.
- Build it against a REAL large menu once a vendor has one, so the design is
  validated against actual data rather than guesses.

## Mockups
- `mockup-storefront-nav-search.html` — full enhanced storefront (sticky tabs +
  search + sections + compact rows).
- `mockup-storefront-search.html` — search-active state (cross-menu matches).

## Status
Reviewed & parked. Pick this up post-launch, starting with the sticky menu nav.
