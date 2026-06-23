"use client";

import { useState } from "react";
import PendingButton from "@/components/PendingButton";
import { updateOrderStatus } from "@/app/actions";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

function statusBadge(status: string): string {
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

export default function RecentOrderRow({ o }: { o: Order & { order_items: OrderItem[] } }) {
  const [open, setOpen] = useState(false);
  const itemCount = o.order_items.reduce((s, it) => s + it.qty, 0);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-panel/40">
        <span className="text-ink/70">{o.customer_name} <span className="text-ink/35">· {itemCount} item{itemCount === 1 ? "" : "s"}</span></span>
        <span className="flex items-center gap-2.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(o.status)}`}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
          <span className="font-semibold text-ink/70">{money(Number(o.subtotal_cad))}</span>
          <span className={`text-ink/30 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-line bg-panel/20 px-4 py-3 text-sm text-ink/70">
          <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            <div className="space-y-0.5">
              <p><span className="capitalize">{o.fulfilment}</span>{o.requested_time ? ` · ${o.requested_time}` : ""} · {o.payment_label ?? o.payment_method}{o.payment_status === "paid" ? " · Paid" : ""}</p>
              <p>{o.customer_phone}{o.customer_email ? ` · ${o.customer_email}` : ""}</p>
              {o.customer_address && <p>{o.customer_address}</p>}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink/40">Items</p>
              <ul className="space-y-0.5">
                {o.order_items.map((it) => (
                  <li key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot ? <span className="text-ink/40"> · {it.service_snapshot}</span> : null}</li>
                ))}
              </ul>
              {o.customer_note && <p className="mt-1 italic text-ink/60">&ldquo;{o.customer_note}&rdquo;</p>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-3">
            <form action={updateOrderStatus.bind(null, o.id, "placed")}>
              <PendingButton pendingLabel="Reopening…" className="inline-flex items-center gap-1.5 rounded-lg border border-spice/50 bg-spice/[0.08] px-3.5 py-2 text-sm font-semibold text-[#9a5a14] transition hover:bg-spice/15">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a4 4 0 0 1 0 8h-1" /></svg>
                Reopen order
              </PendingButton>
            </form>
            <span className="text-xs text-ink/40">moves it back to Live orders</span>
          </div>
        </div>
      )}
    </div>
  );
}
