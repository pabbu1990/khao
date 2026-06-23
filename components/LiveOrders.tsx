"use client";

import { useState } from "react";
import LiveOrderCard from "@/components/LiveOrderCard";
import type { Order, OrderItem } from "@/lib/types";

type OrderRow = Order & { order_items: OrderItem[] };

export default function LiveOrders({ orders }: { orders: OrderRow[] }) {
  // Page always loads in default (full) mode. Compact is opt-in per session.
  const [compact, setCompact] = useState(false);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-ink">Live orders <span className="font-normal text-ink/40">· {orders.length}</span></h2>
        <button
          onClick={() => setCompact((c) => !c)}
          aria-pressed={compact}
          title={compact ? "Show full cards" : "Collapse every order to one line"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${compact ? "border-spice bg-spice/10 text-ink" : "border-line bg-white text-ink/60 hover:border-ink/25"}`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          Compact
        </button>
      </div>
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {/* key includes mode so toggling the master switch remounts cards and
            resets any per-card expand state — the toggle is always authoritative. */}
        {orders.map((o) => <LiveOrderCard key={`${o.id}-${compact ? "c" : "f"}`} o={o} compact={compact} />)}
      </div>
    </>
  );
}
