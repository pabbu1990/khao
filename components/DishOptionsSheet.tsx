"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import { parseOptions, applySelections, validateSelections, type Selection } from "@/lib/options";
import type { Dish } from "@/lib/types";

export default function DishOptionsSheet({ dish, onClose, onAdd }: { dish: Dish; onClose: () => void; onAdd: (selections: Selection[], qty: number) => void }) {
  const groups = parseOptions(dish.options);
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);

  const selections: Selection[] = groups
    .map((g) => ({ groupId: g.id, choiceIds: sel[g.id] ?? [] }))
    .filter((s) => s.choiceIds.length > 0);
  const { delta } = applySelections(groups, selections);
  const unit = Number(dish.price_cad) + delta;

  function toggle(groupId: string, type: "single" | "multi", max: number | null, choiceId: string) {
    setErr(null);
    setSel((s) => {
      const cur = s[groupId] ?? [];
      if (type === "single") return { ...s, [groupId]: cur[0] === choiceId ? [] : [choiceId] };
      const has = cur.includes(choiceId);
      let next = has ? cur.filter((x) => x !== choiceId) : [...cur, choiceId];
      if (!has && max != null && next.length > max) next = cur;
      return { ...s, [groupId]: next };
    });
  }

  function add() {
    const e = validateSelections(groups, selections);
    if (e) { setErr(e); return; }
    onAdd(selections, qty);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div className="relative flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-pop sm:max-h-[85vh] sm:rounded-3xl">
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden"><span className="h-1.5 w-10 rounded-full bg-ink/15" /></div>
        <div className="flex shrink-0 items-start gap-3 border-b border-line px-4 pb-4 pt-3 sm:pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold capitalize text-ink">{dish.name}</p>
            <p className="text-sm text-ink/50">{money(Number(dish.price_cad))}{dish.description ? ` · ${dish.description}` : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/45 transition hover:bg-ink/5">✕</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.07em] text-ink/45">{g.name}</span>
                {g.required ? (
                  <span className="rounded bg-chili/10 px-1.5 py-0.5 text-[10px] font-bold text-chili">Required</span>
                ) : (
                  <span className="text-[11px] font-medium text-ink/40">{g.type === "multi" ? (g.max != null ? `Optional · up to ${g.max}` : "Optional") : "Optional"}</span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {g.choices.map((c) => {
                  const checked = (sel[g.id] ?? []).includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => toggle(g.id, g.type, g.max, c.id)}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition ${checked ? "border-spice bg-spice/[0.06]" : "border-line hover:border-ink/20"}`}>
                      <span className="text-sm font-medium text-ink">{c.label}{c.price ? <span className="ml-1 font-normal text-ink/50">+{money(c.price)}</span> : null}</span>
                      {g.type === "single" ? (
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-spice" : "border-ink/25"}`}>{checked && <span className="h-2.5 w-2.5 rounded-full bg-spice" />}</span>
                      ) : (
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${checked ? "bg-spice" : "border-2 border-ink/25"}`}>{checked && <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {err && <p className="text-sm font-medium text-chili">{err}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-spice/12 p-1 ring-1 ring-spice/25">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Remove one" className="grid h-8 w-8 place-items-center rounded-full text-lg font-bold text-spice transition hover:bg-spice/15">−</button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="Add one" className="grid h-8 w-8 place-items-center rounded-full text-lg font-bold text-spice transition hover:bg-spice/15">+</button>
          </div>
          <button type="button" onClick={add} className="flex-1 rounded-xl bg-spice px-5 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">Add to order · {money(unit * qty)}</button>
        </div>
      </div>
    </div>
  );
}
