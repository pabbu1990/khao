"use client";

import { useState } from "react";
import PendingButton from "@/components/PendingButton";
import { useRouter } from "next/navigation";
import { updateDish, toggleSoldOut, deleteDish } from "@/app/actions";
import DishServiceSelect from "@/components/DishServiceSelect";
import { money } from "@/lib/format";
import type { Dish } from "@/lib/types";

export default function MenuDishRow({ d, services, today, open }: { d: Dish; services: { id: string; name: string }[]; today: number; open: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await updateDish(new FormData(e.currentTarget));
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-2 rounded-xl bg-white p-3 shadow-card ring-1 ring-spice/20">
        <input type="hidden" name="dish_id" value={d.id} />
        <input name="name" required defaultValue={d.name} placeholder="Dish name" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <input name="description" defaultValue={d.description ?? ""} placeholder="Description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <input name="price_cad" type="number" step="0.01" min="0" required defaultValue={Number(d.price_cad)} placeholder="Price (CAD)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25">Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-card">
      {d.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.photo_url} alt="" className="h-12 w-12 rounded-md object-cover" />
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
      <button onClick={() => setEditing(true)} className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">Edit</button>
      {d.is_sold_out && <span className="text-xs font-semibold text-chili">Sold out</span>}
      <form action={toggleSoldOut.bind(null, d.id, !d.is_sold_out)}>
        <PendingButton className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">{d.is_sold_out ? "Available" : "Sold out"}</PendingButton>
      </form>
      <form action={deleteDish.bind(null, d.id)}>
        <PendingButton className="rounded-lg border border-chili/25 px-3 py-1.5 text-sm font-semibold text-chili transition hover:bg-chili/10">Delete</PendingButton>
      </form>
    </div>
  );
}
