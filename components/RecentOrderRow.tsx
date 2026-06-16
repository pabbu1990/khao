"use client";

import { useState } from "react";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export default function RecentOrderRow({ o }: { o: Order & { order_items: OrderItem[] } }) {
  const [open, setOpen] = useState(false);
  const itemCount = o.order_items.reduce((s, it) => s + it.qty, 0);
  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-panel/40">
        <span className="text-ink/70">{o.customer_name} <span className="text-ink/35">· {itemCount} item{itemCount === 1 ? "" : "s"}</span></span>
        <span className="flex items-center gap-2 text-ink/50">
          {ORDER_STATUS_LABEL[o.status] ?? o.status} · {money(Number(o.subtotal_cad))}
          <span className={`text-ink/30 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-line bg-panel/20 px-4 py-3 text-sm text-ink/70">
          <p className="capitalize">
            {o.fulfilment}{o.requested_time ? ` · ${o.requested_time}` : ""} · {o.payment_label ?? o.payment_method}{o.payment_status === "paid" ? " · Paid" : ""}
          </p>
          <p>{o.customer_phone}{o.customer_email ? ` · ${o.customer_email}` : ""}</p>
          {o.customer_address && <p>{o.customer_address}</p>}
          <ul className="mt-2 space-y-0.5">
            {o.order_items.map((it) => (
              <li key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot ? <span className="text-ink/40"> · {it.service_snapshot}</span> : null}</li>
            ))}
          </ul>
          {o.customer_note && <p className="mt-1 italic text-ink/60">&ldquo;{o.customer_note}&rdquo;</p>}
        </div>
      )}
    </div>
  );
}
