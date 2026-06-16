"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateService, toggleServiceActive, deleteService } from "@/app/actions";
import { formatServiceDates } from "@/lib/format";
import MultiDateField from "@/components/MultiDateField";
import type { Service } from "@/lib/types";

export default function ServiceRow({ s }: { s: Service }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await updateService(new FormData(e.currentTarget));
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="space-y-2 rounded-xl bg-white p-4 shadow-card ring-1 ring-spice/20">
        <input type="hidden" name="service_id" value={s.id} />
        <input name="name" required defaultValue={s.name} placeholder="Service name" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <input name="description" defaultValue={s.description ?? ""} placeholder="Short description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
        <MultiDateField initial={s.service_dates} />
        <div className="flex gap-2 pt-1">
          <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25">Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-card">
      <div className="flex-1 min-w-[10rem]">
        <p className="font-semibold text-ink">
          {s.name}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_active ? "bg-curry/15 text-curry" : "bg-ink/10 text-ink/50"}`}>
            {s.is_active ? "Active" : "Off"}
          </span>
        </p>
        {s.description && <p className="text-sm text-ink/50">{s.description}</p>}
        {s.service_dates.length > 0 && <p className="mt-0.5 text-xs font-medium text-ink/50">{formatServiceDates(s.service_dates)}</p>}
      </div>
      <button onClick={() => setEditing(true)} className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">Edit</button>
      <form action={toggleServiceActive.bind(null, s.id, !s.is_active)}>
        <button className="rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-sm font-semibold text-ink/70 transition hover:bg-ink/5">{s.is_active ? "Turn off" : "Turn on"}</button>
      </form>
      <form action={deleteService.bind(null, s.id)}>
        <button className="rounded-lg border border-chili/25 px-3 py-1.5 text-sm font-semibold text-chili transition hover:bg-chili/10">Delete</button>
      </form>
    </div>
  );
}
