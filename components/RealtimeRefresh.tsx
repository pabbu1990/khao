"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribes to realtime changes on the given tables (filtered to one vendor) and
// refreshes the current page's server data. Optional pollMs adds a periodic refresh
// as a safety net (useful on the public storefront where realtime + RLS can miss some events).
export default function RealtimeRefresh({
  vendorId,
  tables,
  filterColumn = "vendor_id",
  pollMs,
}: {
  vendorId: string;
  tables: string[];
  filterColumn?: string;
  pollMs?: number;
}) {
  const router = useRouter();
  const tablesKey = tables.join(",");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`rt-${filterColumn}-${vendorId}-${tablesKey}`);
    for (const table of tablesKey.split(",")) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `${filterColumn}=eq.${vendorId}` },
        () => router.refresh()
      );
    }
    channel.subscribe();

    const interval = pollMs ? setInterval(() => router.refresh(), pollMs) : undefined;

    return () => {
      supabase.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
  }, [vendorId, tablesKey, filterColumn, pollMs, router]);

  return null;
}
