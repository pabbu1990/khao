"use client";

import { useRouter } from "next/navigation";

export default function ReportFilters({ range, status, menu, ranges, statuses, menus }: {
  range: string;
  status: string;
  menu: string;
  ranges: { key: string; label: string }[];
  statuses: { key: string; label: string }[];
  menus: { key: string; label: string }[];
}) {
  const router = useRouter();
  const go = (r: string, s: string, m: string) =>
    router.push(`/dashboard/report?range=${encodeURIComponent(r)}&status=${encodeURIComponent(s)}&menu=${encodeURIComponent(m)}`);
  const sel = "rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink/80";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Range</span>
        <select value={range} onChange={(e) => go(e.target.value, status, menu)} className={sel}>
          {ranges.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Status</span>
        <select value={status} onChange={(e) => go(range, e.target.value, menu)} className={sel}>
          {statuses.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </label>
      {menus.length > 1 && (
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Menu</span>
          <select value={menu} onChange={(e) => go(range, status, e.target.value)} className={sel}>
            <option value="all">All menus</option>
            {menus.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
