"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Customer-storefront menu refresher. Poll-only (no realtime socket per visitor),
// visibility-aware: pauses when the tab is hidden, refreshes immediately on refocus,
// and only re-renders when the menu actually changed (cheap signature compare).
export default function MenuRefresher({ vendorId, intervalMs = 15000 }: { vendorId: string; intervalMs?: number }) {
  const router = useRouter();
  const sig = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function snapshot(): Promise<string | null> {
      const [d, s] = await Promise.all([
        supabase.from("dishes").select("id,is_sold_out,is_active,price_cad,name,service_id").eq("vendor_id", vendorId),
        supabase.from("services").select("id,is_active,name,service_date,service_dates").eq("vendor_id", vendorId),
      ]);
      if (d.error || s.error) return null;
      const dishes = (d.data ?? [])
        .map((x) => `${x.id}:${x.is_sold_out ? 1 : 0}${x.is_active ? 1 : 0}:${x.price_cad}:${x.name}:${x.service_id ?? ""}`)
        .sort();
      const svcs = (s.data ?? [])
        .map((x) => `${x.id}:${x.is_active ? 1 : 0}:${x.name}:${x.service_date ?? ""}:${(x.service_dates ?? []).join(",")}`)
        .sort();
      return JSON.stringify([dishes, svcs]);
    }

    async function poll() {
      if (stopped || (typeof document !== "undefined" && document.hidden)) return;
      const next = await snapshot();
      if (next === null) return;            // query failed — leave state untouched
      if (sig.current === null) {
        sig.current = next;                 // baseline matches what was server-rendered
      } else if (next !== sig.current) {
        sig.current = next;
        router.refresh();
      }
    }

    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await poll();
        if (!stopped) schedule();
      }, intervalMs);
    }

    poll().then(schedule);

    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [vendorId, intervalMs, router]);

  return null;
}
