"use client";

import { useState } from "react";
import PendingButton from "@/components/PendingButton";
import { useRouter } from "next/navigation";
import { updateDish, toggleSoldOut, deleteDish } from "@/app/actions";
import DishServiceSelect from "@/components/DishServiceSelect";
import { money } from "@/lib/format";
import Logo from "@/components/Logo";
import type { Dish } from "@/lib/types";

export default function MenuDishRow({ d, services, today, open, vendorLogo }: { d: Dish; services: { id: string; name: string }[]; today: number; open: number; vendorLogo?: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEditErr(null);
    setBusy(true);
    const res = await updateDish(new FormData(e.currentTarget));
    setBusy(false);
    if (res && !res.ok) { setEditErr(res.error || "Couldn't save the dish."); return; }
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-spice/20">
        <input type="hidden" name="dish_id" value={d.id} />
        <input name="name" required defaultValue={d.name} placeholder="Dish name" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <input name="description" defaultValue={d.description ?? ""} placeholder="Description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <input name="price_cad" type="number" step="any" min="0" required defaultValue={Number(d.price_cad)} placeholder="Price (CAD)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        {editErr && <p className="text-sm text-chili">{editErr}</p>}
        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25">Cancel</button>
        </div>
      </form>
    );
  }

  const available = !d.is_sold_out;

  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-card ${d.is_sold_out ? "opacity-75" : ""}`}>
      {d.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : vendorLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={vendorLogo} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-panel"><Logo size={22} /></span>
      )}
      <div className="min-w-[8rem] flex-1">
        <p className="font-semibold text-ink">{d.name} <span className="font-normal text-ink/40">· {money(Number(d.price_cad))}</span></p>
        {d.description && <p className="text-sm text-ink/50">{d.description}</p>}
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${today > 0 ? "bg-spice/15 text-ink" : "bg-ink/5 text-ink/40"}`}>{today} ordered today</span>
          {open > 0 && <span className="rounded-full bg-curry/15 px-2 py-0.5 text-xs font-semibold text-curry">{open} in open orders</span>}
        </div>
      </div>

      {services.length > 0 && <DishServiceSelect dishId={d.id} current={d.service_id} services={services} />}

      <div className="flex items-center gap-1.5">
        {/* Availability toggle: switch reflects state, label confirms it */}
        <form action={toggleSoldOut.bind(null, d.id, available)}>
          <PendingButton
            swap={false}
            type="submit"
            role="switch"
            aria-checked={available}
            title={available ? "Mark sold out" : "Mark available"}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 transition hover:border-ink/25"
          >
            <span className={`text-xs font-semibold ${available ? "text-curry" : "text-chili"}`}>{available ? "Available" : "Sold out"}</span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${available ? "bg-curry" : "bg-ink/25"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${available ? "left-[1.125rem]" : "left-0.5"}`} />
            </span>
          </PendingButton>
        </form>

        <button onClick={() => setEditing(true)} aria-label="Edit dish" title="Edit"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5 hover:text-ink">
          <PencilIcon />
        </button>

        <form action={deleteDish.bind(null, d.id)}>
          <PendingButton aria-label="Delete dish" title="Delete"
            className="grid h-9 w-9 place-items-center rounded-lg border border-chili/20 text-chili/80 transition hover:bg-chili/10">
            <TrashIcon />
          </PendingButton>
        </form>
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}
