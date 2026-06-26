"use client";

import { useEffect, useRef } from "react";

// Branded confirmation dialog — replaces native window.confirm. Backdrop click
// and Esc cancel; the confirm button is focused for quick keyboard confirm.
export default function ConfirmDialog({
  title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel,
}: {
  title?: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label={title ?? "Confirm"}>
      <button aria-label="Cancel" tabIndex={-1} onClick={onCancel} className="absolute inset-0 cursor-default bg-ink/50" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop">
        <h2 className="font-display text-lg font-bold text-ink">{title ?? "Are you sure?"}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-ink/25">{cancelLabel}</button>
          <button type="button" ref={confirmRef} onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-[1.05] ${danger ? "bg-chili text-white" : "bg-spice text-ink"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
