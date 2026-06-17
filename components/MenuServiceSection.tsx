"use client";

import { useEffect, useState } from "react";

// Collapsible menu section for one service. Expanded by default; remembers
// open/closed per service. Header shows dish count, days, and a sold-out badge,
// plus an optional per-service action slot (e.g. mark this service sold out).
export default function MenuServiceSection({
  id, title, meta, soldOut = 0, off = false, headerActions, children,
}: {
  id: string; title: string; meta: string; soldOut?: number; off?: boolean; headerActions?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(`khao_menu_sec_${id}`) === "0") setOpen(false);
  }, [id]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      localStorage.setItem(`khao_menu_sec_${id}`, next ? "1" : "0");
      return next;
    });
  }

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button onClick={toggle} aria-expanded={open} className="flex flex-1 items-center gap-2 text-left">
          <svg className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${open ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-base font-bold text-ink">{title}</span>
            <span className="text-xs font-medium text-ink/45">{meta}</span>
            {off && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/50">Off</span>}
            {soldOut > 0 && <span className="rounded-full bg-chili/10 px-2 py-0.5 text-xs font-semibold text-chili">{soldOut} sold out</span>}
          </span>
        </button>
        {headerActions && <div className="flex shrink-0 items-center gap-1.5">{headerActions}</div>}
      </div>
      {open && <div className="space-y-2 border-t border-line bg-panel/40 p-3">{children}</div>}
    </section>
  );
}
