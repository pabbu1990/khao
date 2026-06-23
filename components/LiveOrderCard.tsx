"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import OrderAge from "@/components/OrderAge";
import { updateOrderStatus } from "@/app/actions";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

type OrderRow = Order & { order_items: OrderItem[] };

export default function LiveOrderCard({ o, compact }: { o: OrderRow; compact: boolean }) {
  const [contactOpen, setContactOpen] = useState(false);

  const next: { label: string; status: OrderStatus; primary?: boolean }[] =
    ["placed", "accepted", "ready"].includes(o.status)
      ? [{ label: "Complete", status: "completed", primary: true }, { label: "Decline", status: "declined" }]
      : [];
  const badge =
    o.status === "completed" ? "bg-curry/20 text-curry"
    : o.status === "ready" ? "bg-curry/10 text-curry"
    : o.status === "accepted" ? "bg-ink/10 text-ink/70"
    : o.status === "placed" ? "bg-spice/20 text-[#9a5a14]"
    : (o.status === "declined" || o.status === "cancelled") ? "bg-chili/15 text-chili"
    : "bg-ink/10 text-ink/60";
  const isNew = o.status === "placed";
  const ref = o.id.slice(-4).toUpperCase();
  const digits = (o.customer_phone || "").replace(/[^\d]/g, "");
  const mapsUrl = o.customer_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customer_address)}` : null;
  const paid = o.payment_status === "paid";

  return (
    <div className={`rounded-2xl bg-white shadow-card transition ${isNew ? "ring-2 ring-spice/40" : "ring-1 ring-ink/[0.03]"} ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{o.customer_name} <span className="text-xs font-normal text-ink/35">#{ref}</span></p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/55">
            <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2 py-0.5 font-medium capitalize text-ink/70">
              {o.fulfilment === "delivery" ? (
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="1.5" /><circle cx="18.5" cy="18.5" r="1.5" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              )}
              {o.fulfilment}
            </span>
            {o.requested_time && <span>· {o.requested_time}</span>}
            <span>· {o.payment_label ?? (o.payment_method === "online" ? "Paid online" : "Pay direct")}</span>
            {paid && <span className="rounded-full bg-curry/15 px-1.5 py-0.5 font-semibold text-curry">Paid</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{ORDER_STATUS_LABEL[o.status]}</span>
          <OrderAge createdAt={o.created_at} />
        </div>
      </div>

      <ul className={`${compact ? "mt-2" : "mt-3"} space-y-0.5 text-sm text-ink/80`}>
        {o.order_items.map((it) => (
          <li key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot && <span className="text-ink/40"> · {it.service_snapshot}</span>}</li>
        ))}
      </ul>
      {o.customer_note && <p className="mt-2 rounded-lg bg-panel px-3 py-2 text-sm italic text-ink/60">&ldquo;{o.customer_note}&rdquo;</p>}

      {contactOpen && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <a href={`tel:+${digits}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-panel">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              Call
            </a>
            <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-curry transition hover:bg-curry/5">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
              WhatsApp
            </a>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:bg-panel">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Map
              </a>
            )}
            <span className="text-xs text-ink/40">{o.customer_phone}</span>
          </div>
          {o.customer_address && <p className="mt-1.5 text-sm text-ink/50">{o.customer_address}</p>}
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-line ${compact ? "mt-2.5 pt-2.5" : "mt-4 pt-3"}`}>
        <span className="text-lg font-bold text-ink">{money(Number(o.subtotal_cad))}</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setContactOpen((v) => !v)}
            aria-expanded={contactOpen}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${contactOpen ? "border-spice/50 bg-spice/[0.06] text-ink" : "border-line text-ink/60 hover:border-ink/25"}`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            Contact
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${contactOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {next.map((n) => (
            <form key={n.status} action={updateOrderStatus.bind(null, o.id, n.status)}>
              {n.primary ? (
                <SubmitButton className="rounded-xl bg-curry px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-[1.05]">{n.label}</SubmitButton>
              ) : (
                <ConfirmSubmitButton confirmText={`Decline this order from ${o.customer_name}? You can't undo this.`} className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-chili/40 hover:text-chili">{n.label}</ConfirmSubmitButton>
              )}
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
