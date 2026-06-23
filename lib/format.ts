export function money(n: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  // Only accept a well-formed scheme://host value; otherwise fall back.
  return /^https?:\/\/[^/]+/.test(raw) ? raw : "http://localhost:3000";
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  placed: "New",
  accepted: "Accepted",
  ready: "Ready",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export function formatServiceDate(d: string): string {
  // d is "YYYY-MM-DD"; format as "Mon, Jun 16" without timezone drift.
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  const dt = new Date(Date.UTC(y, m - 1, day));
  return new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(dt);
}

export function formatServiceDates(dates: string[]): string {
  if (!dates || dates.length === 0) return "";
  const items = [...new Set(dates)]
    .map((d) => d.split("-").map(Number))
    .filter((p) => p[0] && p[1] && p[2])
    .map(([y, m, day]) => ({ y, m, day, t: Date.UTC(y, m - 1, day) }))
    .sort((a, b) => a.t - b.t);
  if (items.length === 0) return "";

  const wk = (t: number) => new Intl.DateTimeFormat("en-CA", { weekday: "short", timeZone: "UTC" }).format(new Date(t));
  const md = (t: number) => new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(t));
  const DAY = 86400000;

  // Group runs of consecutive days.
  const groups: { start: typeof items[0]; end: typeof items[0] }[] = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && it.t - last.end.t === DAY) last.end = it;
    else groups.push({ start: it, end: it });
  }

  return groups.map((g) => {
    if (g.start.t === g.end.t) return `${wk(g.start.t)} ${md(g.start.t)}`;
    const dateRange = g.start.m === g.end.m ? `${md(g.start.t)}–${g.end.day}` : `${md(g.start.t)}–${md(g.end.t)}`;
    return `${wk(g.start.t)}–${wk(g.end.t)} ${dateRange}`;
  }).join(" · ");
}

// ---- Menu scoping (Report) ----
// When the report is filtered to a single menu, rows/amounts/CSV show only that
// menu's slice of each order. MENU_NONE is the bucket key for unassigned items.
export const MENU_NONE = "__unassigned__";

export function menuItemsOf<T extends { service_snapshot: string | null }>(items: T[], menu: string): T[] {
  if (menu === "all") return items;
  return items.filter((it) => (it.service_snapshot ?? MENU_NONE) === menu);
}

export function menuPortion(items: { service_snapshot: string | null; price_snapshot: number; qty: number }[], menu: string): number {
  return menuItemsOf(items, menu).reduce((sum, it) => sum + Number(it.price_snapshot) * Number(it.qty), 0);
}
