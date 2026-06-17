"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Remembers the vendor's last-used Report filter. Saves the current range/status
// to localStorage, and on a bare visit (no params) restores the saved filter.
export default function ReportFilterMemory() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const range = params.get("range");
    const status = params.get("status");
    if (range || status) {
      localStorage.setItem("khao_report_filter", JSON.stringify({ range: range ?? "7d", status: status ?? "all" }));
      return;
    }
    const saved = localStorage.getItem("khao_report_filter");
    if (!saved) return;
    try {
      const { range: r, status: st } = JSON.parse(saved) as { range?: string; status?: string };
      if ((r && r !== "7d") || (st && st !== "all")) {
        const qs = new URLSearchParams();
        if (r) qs.set("range", r);
        if (st) qs.set("status", st);
        router.replace(`${pathname}?${qs.toString()}`);
      }
    } catch { /* ignore bad saved value */ }
  }, [params, pathname, router]);

  return null;
}
