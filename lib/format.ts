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
