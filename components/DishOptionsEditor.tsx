"use client";

import { useState } from "react";
import { genId, type OptionGroup } from "@/lib/options";

const PRESETS: { label: string; make: () => OptionGroup }[] = [
  { label: "Spice level", make: () => ({ id: genId(), name: "Spice level", type: "single", required: true, max: null, choices: [
    { id: genId(), label: "Mild", price: 0 }, { id: genId(), label: "Medium", price: 0 }, { id: genId(), label: "Hot", price: 0 },
  ] }) },
  { label: "Size", make: () => ({ id: genId(), name: "Size", type: "single", required: true, max: null, choices: [
    { id: genId(), label: "Half", price: 0 }, { id: genId(), label: "Full", price: 0 },
  ] }) },
  { label: "Add-ons", make: () => ({ id: genId(), name: "Add-ons", type: "multi", required: false, max: null, choices: [
    { id: genId(), label: "Extra roti", price: 1 },
  ] }) },
  { label: "Custom", make: () => ({ id: genId(), name: "", type: "single", required: true, max: null, choices: [{ id: genId(), label: "", price: 0 }] }) },
];

function Plus({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
function Trash() {
  return <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>;
}

export default function DishOptionsEditor({ groups, onChange }: { groups: OptionGroup[]; onChange: (g: OptionGroup[]) => void }) {
  const [openPrice, setOpenPrice] = useState<Set<string>>(new Set());
  const update = (gi: number, patch: Partial<OptionGroup>) => onChange(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const updateChoice = (gi: number, ci: number, patch: Partial<OptionGroup["choices"][number]>) =>
    update(gi, { choices: groups[gi].choices.map((c, i) => (i === ci ? { ...c, ...patch } : c)) });
  const setType = (gi: number, type: OptionGroup["type"]) => update(gi, { type, required: type === "single" });

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/45">Options</p>
      <p className="mt-0.5 text-xs text-ink/50">Let customers customize this dish — tap a starter or build your own.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button key={p.label} type="button" onClick={() => onChange([...groups, p.make()])}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition ${i === PRESETS.length - 1 ? "border-line text-ink/55 hover:border-ink/25" : "border-spice/30 bg-spice/[0.07] text-[#9a5a14] hover:bg-spice/[0.12]"}`}>
            <Plus /> {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((g, gi) => (
          <div key={g.id} className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(36,20,9,0.04)]">
            <div className="flex items-center gap-2">
              <input value={g.name} onChange={(e) => update(gi, { name: e.target.value })} placeholder="Group name"
                className="min-w-0 flex-1 bg-transparent text-base font-bold text-ink outline-none placeholder:font-semibold placeholder:text-ink/30" />
              <div className="inline-flex shrink-0 rounded-lg bg-panel p-0.5 text-xs font-semibold">
                <button type="button" onClick={() => setType(gi, "single")} className={`rounded-md px-2.5 py-1 transition ${g.type === "single" ? "bg-white text-ink shadow-sm" : "text-ink/50"}`}>Pick one</button>
                <button type="button" onClick={() => setType(gi, "multi")} className={`rounded-md px-2.5 py-1 transition ${g.type === "multi" ? "bg-white text-ink shadow-sm" : "text-ink/50"}`}>Pick any</button>
              </div>
              <button type="button" onClick={() => onChange(groups.filter((_, i) => i !== gi))} aria-label="Remove group" className="shrink-0 text-ink/30 transition hover:text-chili"><Trash /></button>
            </div>
            <p className="mt-1 text-xs text-ink/45">{g.type === "single" ? "Customers must pick one." : "Optional — customers can add any."}</p>

            <div className="mt-1.5">
              {g.choices.map((c, ci) => {
                const showPrice = c.price > 0 || openPrice.has(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-2 border-t border-[#F1E9DA] py-2.5 first:border-t-0">
                    <input value={c.label} onChange={(e) => updateChoice(gi, ci, { label: e.target.value })} placeholder="Choice name"
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink/30" />
                    {showPrice ? (
                      <span className="flex items-center text-sm text-ink/70">
                        <span className="text-ink/40">+$</span>
                        <input value={c.price ? String(c.price) : ""} onChange={(e) => updateChoice(gi, ci, { price: Number(e.target.value) || 0 })}
                          type="number" step="any" min="0" placeholder="0" className="w-12 bg-transparent pl-0.5 text-left outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                      </span>
                    ) : (
                      <button type="button" onClick={() => setOpenPrice((s) => new Set(s).add(c.id))} className="text-xs font-medium text-ink/35 transition hover:text-ink/55">Free</button>
                    )}
                    <button type="button" onClick={() => update(gi, { choices: g.choices.filter((_, i) => i !== ci) })} aria-label="Remove choice" className="shrink-0 text-ink/25 transition hover:text-chili">✕</button>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={() => update(gi, { choices: [...g.choices, { id: genId(), label: "", price: 0 }] })}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9a5a14] transition hover:brightness-110"><Plus className="h-3 w-3" /> Add choice</button>
          </div>
        ))}
      </div>
    </div>
  );
}
