"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Platform-wide live refresh (used by Admin, which spans all vendors so it can't
// filter by vendor_id). Subscribes to the given tables with no filter and also
// polls as a safety net.
export default function PollRefresh({ tables = [], pollMs = 15000 }: { tables?: string[]; pollMs?: number }) {
  const router = useRouter();
  const key = tables.join(",");

  useEffect(() => {
    const supabase = createClient();
    const channel = key ? supabase.channel(`poll-rt-${key}`) : null;
    if (channel) {
      for (const table of key.split(",")) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, () => router.refresh());
      }
      channel.subscribe();
    }
    const interval = setInterval(() => router.refresh(), pollMs);
    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [key, pollMs, router]);

  return null;
}
