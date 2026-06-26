"use client";

import { useMemo, useState } from "react";
import PendingButton from "@/components/PendingButton";
import { setPaymentStatus } from "@/app/actions";
import { money, ORDER_STATUS_LABEL, menuItemsOf, menuPortion } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

type Row = Order & { order_items: OrderItem[] };

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Toronto", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

function statusClasses(status: string): string {
  switch (status) {
    case "completed": return "bg-curry/20 text-curry";
    case "ready": return "bg-curry/10 text-curry";
    case "accepted": return "bg-ink/10 text-ink/70";
    case "placed": return "bg-spice/20 text-[#9a5a14]";
    case "declined":
    case "cancelled": return "bg-chili/15 text-chili";
    default: return "bg-ink/10 text-ink/60";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function PayBadge({ paid }: { paid: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-curry/15 text-curry" : "bg-chili/15 text-chili"}`}>
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

function PayToggle({ id, paid }: { id: string; paid: boolean }) {
  return (
    <form action={setPaymentStatus.bind(null, id, paid ? "unpaid" : "paid")}>
      <PendingButton className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink/70 transition hover:bg-panel">
        {paid ? "Mark unpaid" : "Mark paid"}
      </PendingButton>
    </form>
  );
}

function FulfilmentIcon({ fulfilment }: { fulfilment: string }) {
  if (fulfilment === "delivery") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 5h11v11H3z" /><path d="M14 9h4l3 3v4h-7z" /><circle cx="7" cy="18.5" r="1.6" /><circle cx="17.5" cy="18.5" r="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 4 6v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6l-2-4z" /><path d="M4 6h16" /><path d="M15 10a3 3 0 0 1-6 0" />
    </svg>
  );
}

function ReportCard({ o, menu }: { o: Row; menu: string }) {
  const [open, setOpen] = useState(false);
  const items = menuItemsOf(o.order_items, menu);
  const amount = menu === "all" ? Number(o.subtotal_cad) : menuPortion(o.order_items, menu);
  const lost = o.status === "declined" || o.status === "cancelled";
  const unitCount = items.reduce((n, it) => n + it.qty, 0);

  return (
    <div className="rounded-xl bg-white p-3.5 shadow-card">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{o.customer_name}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink/45">
            <FulfilmentIcon fulfilment={o.fulfilment} />
            <span className="capitalize">{o.fulfilment}</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">{unitCount} item{unitCount === 1 ? "" : "s"}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <StatusBadge status={o.status} />
          <svg viewBox="0 0 24 24" className={`h-4 w-4 text-ink/30 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <>
          <div className="mt-2.5 text-sm text-ink/80">
            {items.map((it) => (
              <div key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot ? <span className="text-ink/40"> · {it.service_snapshot}</span> : null}</div>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink/45">
            {o.customer_phone}
            {o.customer_address ? <span className="text-ink/40"> · {o.customer_address}</span> : null}
            <span className="text-ink/35"> · {fmtTime(o.created_at)}</span>
          </p>
        </>
      )}

      <div className={`flex items-center justify-between gap-3 ${open ? "mt-2.5 border-t border-ink/5 pt-2.5" : "mt-2.5"}`}>
        <div className="min-w-0">
          <span className="text-lg font-bold text-ink">{money(amount)}</span>
          {open && <span className="block text-xs text-ink/40">{o.payment_label ?? o.payment_method}</span>}
        </div>
        {!lost && (
          <div className="flex shrink-0 items-center gap-2">
            <PayBadge paid={o.payment_status === "paid"} />
            <PayToggle id={o.id} paid={o.payment_status === "paid"} />
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-card sm:block">
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/45">{label}</p>
      <div className="text-right sm:mt-0.5 sm:text-left">
        <p className={`text-xl font-bold leading-tight sm:text-2xl ${accent ? "text-chili" : "text-ink"}`}>{value}</p>
        {sub && <p className="text-xs text-ink/45">{sub}</p>}
      </div>
    </div>
  );
}

type Bucket = { key: string; label: string; qty: number; revenue: number };

export default function ReportTable({ rows, menu, menuLabel, breakdown, range, status }: { rows: Row[]; menu: string; menuLabel?: string; breakdown: Bucket[]; range: string; status: string }) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(menu !== "all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      o.order_items.some((it) => it.name_snapshot?.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const kpis = useMemo(() => {
    const isLost = (s: string) => s === "declined" || s === "cancelled";
    let total = 0, unpaid = 0;
    for (const o of filtered) {
      const amt = menu === "all" ? Number(o.subtotal_cad) : menuPortion(o.order_items, menu);
      total += amt;
      if (o.payment_status !== "paid" && !isLost(o.status)) unpaid += amt;
    }
    return { total, unpaid, count: filtered.length };
  }, [filtered, menu]);

  const itemsOf = (o: Row) => menuItemsOf(o.order_items, menu);
  const amountOf = (o: Row) => (menu === "all" ? Number(o.subtotal_cad) : menuPortion(o.order_items, menu));

  return (
    <div>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <Kpi label="Orders" value={String(kpis.count)} />
        <Kpi label="Total" value={money(kpis.total)} />
        <Kpi label="Unpaid" value={money(kpis.unpaid)} accent={kpis.unpaid > 0} sub={kpis.unpaid > 0 ? "owed to you" : "all collected"} />
      </div>

      {breakdown.length > 1 && (
        <div className="mt-3 overflow-hidden rounded-xl bg-white shadow-card">
          <button onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-panel/40">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">By menu</span>
            <span className="inline-flex items-center gap-2 text-xs text-ink/50">
              {menu !== "all" && menuLabel ? menuLabel : `${breakdown.length} menus`}
              <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </button>
          {menuOpen && (
            <div className="border-t border-ink/5">
              <table className="w-full text-sm">
                <tbody>
                  {breakdown.map((b) => {
                    const active = b.key === menu;
                    return (
                      <tr key={b.key} className={`border-t border-ink/5 first:border-t-0 transition hover:bg-panel/40 ${active ? "bg-spice/10" : ""}`}>
                        <td className="px-4 py-2">
                          <a href={`/dashboard/report?range=${range}&status=${status}&menu=${encodeURIComponent(b.key)}`} className={`font-semibold ${active ? "text-ink" : "text-ink/80 hover:text-spice"}`}>{b.label}</a>
                        </td>
                        <td className="px-4 py-2 text-right text-ink/60 whitespace-nowrap">{b.qty} item{b.qty === 1 ? "" : "s"}</td>
                        <td className="px-4 py-2 text-right font-semibold text-ink whitespace-nowrap">{money(b.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {menu !== "all" && (
                <div className="border-t border-ink/5 px-4 py-2 text-right">
                  <a href={`/dashboard/report?range=${range}&status=${status}&menu=all`} className="text-xs font-semibold text-spice">Clear menu filter</a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, or item"
            className="w-full rounded-lg border border-ink/15 bg-white py-2 pl-9 pr-8 text-sm text-ink placeholder:text-ink/35 focus:border-spice focus:outline-none focus:ring-2 focus:ring-spice/20"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/40 hover:text-ink" aria-label="Clear search">✕</button>
          )}
        </div>
        <p className="text-sm text-ink/50">
          {query ? `${filtered.length} of ${rows.length}` : `${rows.length} order${rows.length === 1 ? "" : "s"}`}
          {menu !== "all" && menuLabel && <span className="text-ink/40"> · filtered to {menuLabel}</span>}
        </p>
      </div>

      {/* Desktop table */}
      <div className="mt-3 hidden overflow-hidden rounded-xl bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-panel text-left text-xs uppercase tracking-[0.04em] text-ink/50">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink/40">{query ? "No orders match your search." : "No orders for this filter."}</td></tr>
            )}
            {filtered.map((o) => (
              <tr key={o.id} className="border-t border-ink/5 align-top transition hover:bg-panel/40">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{o.customer_name}</p>
                  <p className="capitalize text-ink/45">{o.fulfilment}</p>
                  <p className="text-xs text-ink/40">{fmtTime(o.created_at)}</p>
                </td>
                <td className="px-4 py-3 text-ink/70">
                  <p className="whitespace-nowrap">{o.customer_phone}</p>
                  {o.customer_email && <p className="text-ink/50">{o.customer_email}</p>}
                  {o.customer_address && <p className="text-ink/45">{o.customer_address}</p>}
                </td>
                <td className="px-4 py-3 text-ink/80">
                  {itemsOf(o).map((it) => (
                    <div key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot ? <span className="text-ink/40"> · {it.service_snapshot}</span> : null}</div>
                  ))}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink whitespace-nowrap">{money(amountOf(o))}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3">
                  {o.status === "declined" || o.status === "cancelled" ? (
                    <p className="text-ink/40">{o.payment_label ?? o.payment_method}</p>
                  ) : (
                    <>
                      <p className="text-ink/70">{o.payment_label ?? o.payment_method}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PayBadge paid={o.payment_status === "paid"} />
                        <PayToggle id={o.id} paid={o.payment_status === "paid"} />
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-3 space-y-3 md:hidden">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white px-4 py-8 text-center text-ink/40 shadow-card">{query ? "No orders match your search." : "No orders for this filter."}</div>
        )}
        {filtered.map((o) => (
          <ReportCard key={o.id} o={o} menu={menu} />
        ))}
      </div>
    </div>
  );
}
