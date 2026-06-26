"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";
import ConfirmDialog from "@/components/ConfirmDialog";

// Submit button that opens a branded confirm dialog before firing the enclosing
// form's server action — used to guard destructive actions like declining an order.
export default function ConfirmSubmitButton({
  children, className, confirmText, title, confirmLabel = "Confirm", danger = true, pendingLabel,
}: {
  children: React.ReactNode; className?: string; confirmText: string; title?: string;
  confirmLabel?: string; danger?: boolean; pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button type="button" ref={btnRef} disabled={pending} aria-busy={pending} onClick={() => setOpen(true)} className={className}>
        {pending ? <span className="inline-flex items-center justify-center gap-1.5"><Spinner />{pendingLabel ?? "…"}</span> : children}
      </button>
      {open && (
        <ConfirmDialog
          title={title}
          message={confirmText}
          confirmLabel={confirmLabel}
          danger={danger}
          onCancel={() => setOpen(false)}
          onConfirm={() => { setOpen(false); btnRef.current?.form?.requestSubmit(); }}
        />
      )}
    </>
  );
}
