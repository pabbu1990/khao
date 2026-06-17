"use client";

import { useEffect, useState } from "react";
import AddServiceForm from "@/components/AddServiceForm";

// Renders the Menus page header (title + subtitle) with the "Add a menu" control
// inline, and the add-menu form expanding full-width below when opened. After a
// menu is added the form collapses and a success message shows.
export default function AddSectionPanel({ defaultOpen = false, subtitle }: { defaultOpen?: boolean; subtitle: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (added) {
      const t = setTimeout(() => setAdded(false), 4000);
      return () => clearTimeout(t);
    }
  }, [added]);

  function handleAdded() {
    setOpen(false);
    setAdded(true);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Menus</h1>
          <p className="mt-1 max-w-xl text-sm text-ink/50">{subtitle}</p>
        </div>
        {!open && (
          <button onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink/70 shadow-card transition hover:border-ink/25">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            Add a menu
          </button>
        )}
      </div>

      {added && !open && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-curry/30 bg-curry/[0.06] px-4 py-2.5 text-sm font-medium text-curry">
          <span aria-hidden="true">✓</span> Menu added — add another, or add dishes to it below.
        </div>
      )}

      {open && (
        <div className="relative mt-4">
          <AddServiceForm onAdded={handleAdded} />
          {!defaultOpen && (
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-sm font-semibold text-ink/45 transition hover:text-ink">Close</button>
          )}
        </div>
      )}
    </div>
  );
}
