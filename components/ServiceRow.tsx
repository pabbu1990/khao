"use client";

import { useState } from "react";
import PendingButton from "@/components/PendingButton";
import { useRouter } from "next/navigation";
import { updateService, toggleServiceActive, deleteService, duplicateService } from "@/app/actions";
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
    <div className={`flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-card ${s.is_active ? "" : "opacity-75"}`}>
      <div className="min-w-[10rem] flex-1">
        <p className="font-semibold text-ink">{s.name}</p>
        {s.description && <p className="text-sm text-ink/50">{s.description}</p>}
        {s.service_dates.length > 0 && <p className="mt-0.5 text-xs font-medium text-ink/50">{formatServiceDates(s.service_dates)}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Active toggle: switch reflects state, label confirms it */}
        <form action={toggleServiceActive.bind(null, s.id, !s.is_active)}>
          <PendingButton
            swap={false}
            type="submit"
            role="switch"
            aria-checked={s.is_active}
            title={s.is_active ? "Turn off (hide from your page)" : "Turn on (show on your page)"}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 transition hover:border-ink/25"
          >
            <span className={`text-xs font-semibold ${s.is_active ? "text-curry" : "text-ink/40"}`}>{s.is_active ? "Active" : "Off"}</span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${s.is_active ? "bg-curry" : "bg-ink/25"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${s.is_active ? "left-[1.125rem]" : "left-0.5"}`} />
            </span>
          </PendingButton>
        </form>

        <button onClick={() => setEditing(true)} aria-label="Edit service" title="Edit"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5 hover:text-ink">
          <PencilIcon />
        </button>

        <form action={duplicateService.bind(null, s.id)}>
          <PendingButton aria-label="Duplicate service" title="Duplicate this service and its dishes"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5 hover:text-ink">
            <CopyIcon />
          </PendingButton>
        </form>

        <form action={deleteService.bind(null, s.id)}>
          <PendingButton aria-label="Delete service" title="Delete"
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
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
