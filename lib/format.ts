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
