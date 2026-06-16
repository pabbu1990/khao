"use client";

import { useRef, useState } from "react";
import { formatServiceDate } from "@/lib/format";

export default function MultiDateField({ initial = [] }: { initial?: string[] }) {
  const [dates, setDates] = useState<string[]>([...initial].sort());
  const ref = useRef<HTMLInputElement>(null);

  function addDate(d: string) {
    if (d && !dates.includes(d)) setDates([...dates, d].sort());
  }
  function remove(d: string) {
    setDates(dates.filter((x) => x !== d));
  }
  function openPicker() {
    const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch { /* fall through */ }
    }
    el.focus();
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink/70">Service dates <span className="text-ink/40">(optional)</span></span>
      <div className="relative mt-1.5 inline-block">
        <button type="button" onClick={openPicker} className="inline-flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">
          <span className="text-base leading-none">+</span> Add a date
        </button>
        <input ref={ref} type="date" value="" tabIndex={-1} aria-hidden="true"
          onChange={(e) => addDate(e.target.value)}
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0" />
      </div>
      <p className="mt-1 text-xs text-ink/45">Pick a date to add it — you can add multiple dates.</p>
      {dates.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {dates.map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1 text-sm text-ink">
              {formatServiceDate(d)}
              <button type="button" aria-label="Remove date" onClick={() => remove(d)} className="text-base leading-none text-ink/40 transition hover:text-chili">×</button>
            </span>
          ))}
        </div>
      )}
      {dates.map((d) => <input key={d} type="hidden" name="service_dates" value={d} />)}
    </div>
  );
}
