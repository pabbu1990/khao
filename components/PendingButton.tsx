"use client";

import { useFormStatus } from "react-dom";
import Spinner from "@/components/Spinner";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;   // text shown next to spinner while submitting (swap mode)
  swap?: boolean;          // true: replace children with spinner; false: keep children, just dim
  busyClassName?: string;  // extra classes applied while pending
};

// A submit button that reflects the enclosing <form>'s pending state via
// useFormStatus — works for server-action forms with no client handler.
export default function PendingButton({
  className = "",
  children,
  pendingLabel,
  swap = true,
  busyClassName = "opacity-70",
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      disabled={pending || rest.disabled}
      aria-busy={pending}
      className={`${className} ${pending ? busyClassName : ""}`}
    >
      {pending && swap ? (
        <span className="inline-flex items-center justify-center gap-1.5"><Spinner />{pendingLabel}</span>
      ) : (
        children
      )}
    </button>
  );
}
