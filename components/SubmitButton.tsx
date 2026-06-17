"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

export default function SubmitButton({ children, className, pendingLabel }: { children: React.ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-1.5"><Spinner />{pendingLabel ?? "…"}</span>
      ) : (
        children
      )}
    </button>
  );
}
