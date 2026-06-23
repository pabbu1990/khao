"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

// Submit button that asks for confirmation before firing the enclosing form's
// server action — used to guard destructive actions like declining an order.
export default function ConfirmSubmitButton({ children, className, confirmText, pendingLabel }: { children: React.ReactNode; className?: string; confirmText: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => { if (!window.confirm(confirmText)) e.preventDefault(); }}
      className={className}
    >
      {pending ? <span className="inline-flex items-center justify-center gap-1.5"><Spinner />{pendingLabel ?? "…"}</span> : children}
    </button>
  );
}
