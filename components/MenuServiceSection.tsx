"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PendingButton from "@/components/PendingButton";
import MultiDateField from "@/components/MultiDateField";
import { updateService, toggleServiceActive, deleteService, duplicateService } from "@/app/actions";
import type { Service } from "@/lib/types";

// A menu section = one service. Collapsible (remembered), with the dishes nested
// inside, a per-section "mark all" slot, and a ⋯ menu that holds the service
// management actions (edit, turn off/on, duplicate, delete) + inline edit form.
export default function MenuServiceSection({
  service, meta, soldOut = 0, markAll, children,
}: {
  service: Service; meta: string; soldOut?: number; markAll?: React.ReactNode; children: React.ReactNode;
}) {
  const router = useRouter();
  const id = service.id;
  const off = !service.is_active;
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (localStorage.getItem(`khao_menu_sec_${id}`) === "0") setOpen(false); }, [id]);
  function toggle() { setOpen((o) => { const n = !o; localStorage.setItem(`khao_menu_sec_${id}`, n ? "1" : "0"); return n; }); }

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
      <section className="mt-3 rounded-2xl border border-spice/30 bg-white p-4 shadow-card">
        <form onSubmit={save} className="space-y-3">
          <input type="hidden" name="service_id" value={id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Menu name</span>
              <input name="name" required defaultValue={service.name} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Description</span>
              <input name="description" defaultValue={service.description ?? ""} placeholder="Optional" className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
            </label>
          </div>
          <MultiDateField initial={service.service_dates} />
          <div className="flex gap-2 pt-1">
            <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/25">Cancel</button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="relative mt-3 rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button onClick={toggle} aria-expanded={open} className="flex flex-1 items-center gap-2 text-left">
          <svg className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${open ? "" : "-rotate-90"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-display text-base font-bold text-ink">{service.name}</span>
            <span className="text-xs font-medium text-ink/45">{meta}</span>
            {off && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/50">Off</span>}
            {soldOut > 0 && <span className="rounded-full bg-chili/10 px-2 py-0.5 text-xs font-semibold text-chili">{soldOut} sold out</span>}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden sm:contents">{markAll}</span>
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Menu options" className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/55 transition hover:bg-ink/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
            </button>
            {menuOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default bg-ink/30" aria-hidden="true" onClick={() => setMenuOpen(false)} tabIndex={-1} />
                <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-pop">
                  <button onClick={() => { setEditing(true); setMenuOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition hover:bg-panel/60"><MiPencil /> Edit details</button>
                  <form action={duplicateService.bind(null, id)}>
                    <PendingButton className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition hover:bg-panel/60"><MiCopy /> Duplicate</PendingButton>
                  </form>
                  <form action={toggleServiceActive.bind(null, id, !service.is_active)}>
                    <PendingButton className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition hover:bg-panel/60"><MiEye /> {service.is_active ? "Turn off (hide)" : "Turn on"}</PendingButton>
                  </form>
                  <div className="border-t border-line sm:hidden">{markAll}</div>
                  <form action={deleteService.bind(null, id)}>
                    <PendingButton className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2 text-left text-sm text-chili transition hover:bg-chili/5"><MiTrash /> Delete menu</PendingButton>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {open && <div className="space-y-2 rounded-b-2xl border-t border-line bg-panel/40 p-3">{children}</div>}
    </section>
  );
}

function MiPencil() { return <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>; }
function MiEye() { return <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>; }
function MiCopy() { return <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>; }
function MiTrash() { return <svg viewBox="0 0 24 24" className="h-4 w-4 text-chili" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>; }
