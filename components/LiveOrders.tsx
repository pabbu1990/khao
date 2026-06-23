"use client";

import { useEffect, useState } from "react";
import LiveOrderCard from "@/components/LiveOrderCard";
import type { Order, OrderItem } from "@/lib/types";

type OrderRow = Order & { order_items: OrderItem[] };

export default function LiveOrders({ orders }: { orders: OrderRow[] }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => { if (localStorage.getItem("khao_orders_compact") === "1") setCompact(true); }, []);
  function toggle() { setCompact((c) => { const n = !c; localStorage.setItem("khao_orders_compact", n ? "1" : "0"); return n; }); }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Live orders <span className="font-normal text-ink/40">· {orders.length}</span></h2>
        <button
          onClick={toggle}
          aria-pressed={compact}
          title="Tighten the cards for busy days"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${compact ? "border-spice bg-spice/10 text-ink" : "border-line bg-white text-ink/60 hover:border-ink/25"}`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          Compact
        </button>
      </div>
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {orders.map((o) => <LiveOrderCard key={o.id} o={o} compact={compact} />)}
      </div>
    </>
  );
}
