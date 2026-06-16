"use client";

import { useEffect, useState } from "react";

// Shows "Updated just now · live" and counts up until the next server refresh,
// at which point the `at` prop changes and it resets.
export default function LiveStamp({ at }: { at: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const secs = Math.max(0, Math.round((Date.now() - at) / 1000));
  const when = secs < 5 ? "just now" : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink/40">
      <span className="h-1.5 w-1.5 rounded-full bg-curry" />
      Updated {when} · live
    </span>
  );
}
