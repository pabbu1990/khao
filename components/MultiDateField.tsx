"use client";

import { useState } from "react";
import { formatServiceDates } from "@/lib/format";

const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function MultiDateField({ initial = [] }: { initial?: string[] }) {
  const [dates, setDates] = useState<string[]>([...initial].sort());
  const [open, setOpen] = useState(false);

  const today = new Date();
  const todayKey = ymd(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 }); // m: 1-12

  const firstDow = new Date(view.y, view.m - 1, 1).getDay();
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const atCurrentMonth = view.y === today.getFullYear() && view.m === today.getMonth() + 1;

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function shiftMonth(delta: number) {
    setView((v) => {
      const idx = (v.y * 12 + (v.m - 1)) + delta;
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    });
  }
  function toggle(day: number) {
    const k = ymd(view.y, view.m, day);
    if (k < todayKey) return;
    setDates((ds) => (ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k].sort()));
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink/70">Dates <span className="text-ink/40">(optional)</span></span>

      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          {dates.length > 0 ? "Edit dates" : "Add dates"}
        </button>
        {dates.length > 0 && (
          <span className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-ink">{formatServiceDates(dates)}</span>
        )}
      </div>

      {open && (
        <div className="mt-2 w-full max-w-[320px] rounded-2xl border border-line bg-white p-3 shadow-pop">
          <div className="flex items-center justify-between px-1 py-1">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={atCurrentMonth} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5 disabled:opacity-30" aria-label="Previous month">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <span className="font-display text-sm font-bold text-ink">{MONTHS[view.m - 1]} {view.y}</span>
            <button type="button" onClick={() => shiftMonth(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5" aria-label="Next month">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {DOW.map((d, i) => <div key={i} className="pb-1 text-center text-xs font-bold text-ink/35">{d}</div>)}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const k = ymd(view.y, view.m, day);
              const past = k < todayKey;
              const selected = dates.includes(k);
              const isToday = k === todayKey;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(day)}
                  disabled={past}
                  aria-pressed={selected}
                  className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${
                    selected ? "bg-spice font-bold text-ink"
                    : past ? "cursor-default text-ink/20"
                    : "text-ink hover:bg-spice/15"
                  } ${isToday && !selected ? "ring-1 ring-inset ring-spice font-bold" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-line pt-2.5">
            <button type="button" onClick={() => setDates([])} className="text-sm font-semibold text-ink/45 transition hover:text-chili">Clear</button>
            <span className="text-xs text-ink/45">{dates.length} {dates.length === 1 ? "date" : "dates"} selected</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-spice px-4 py-1.5 text-sm font-semibold text-ink transition hover:brightness-[1.04]">Done</button>
          </div>
        </div>
      )}

      {dates.map((d) => <input key={d} type="hidden" name="service_dates" value={d} />)}
    </div>
  );
}
