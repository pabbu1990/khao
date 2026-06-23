"use client";

import { useEffect, useState } from "react";

// Live "waiting" timer for an open order. Escalates colour the longer it sits
// so a kitchen never lets an order go cold. Ticks every 30s.
export default function OrderAge({ createdAt }: { createdAt: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  const label = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  const tone = mins >= 20 ? "text-chili" : mins >= 10 ? "text-[#9a5a14]" : "text-ink/45";

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${tone}`}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      {label}
    </span>
  );
}
