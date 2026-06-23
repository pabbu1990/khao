"use client";

import { useEffect, useState } from "react";

// Live "waiting" timer for an open order. Escalates colour the longer it sits.
// `pill` renders a compact coloured chip (e.g. "22m") for the compact row.
export default function OrderAge({ createdAt, pill = false }: { createdAt: string; pill?: boolean }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  const clock = (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
  );

  if (pill) {
    const short = mins < 1 ? "now" : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60}m`;
    const cls = mins >= 20 ? "bg-chili/12 text-chili" : mins >= 10 ? "bg-spice/15 text-[#9a5a14]" : "bg-ink/[0.06] text-ink/50";
    return (
      <span className={`inline-flex min-w-[3.1rem] shrink-0 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold ${cls}`}>
        {clock}{short}
      </span>
    );
  }

  const tone = mins >= 20 ? "text-chili" : mins >= 10 ? "text-[#9a5a14]" : "text-ink/45";
  const label = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>{clock}{label}</span>;
}
