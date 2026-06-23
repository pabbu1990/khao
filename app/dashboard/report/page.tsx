import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import LiveStamp from "@/components/LiveStamp";
import ReportFilterMemory from "@/components/ReportFilterMemory";
import ReportFilters from "@/components/ReportFilters";
import ReportTable from "@/components/ReportTable";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Order & { order_items: OrderItem[] };

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "all", label: "All" },
];
const STATUSES = [
  { key: "all", label: "All" },
  { key: "placed", label: "New" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));

export default async function ReportPage({ searchParams }: { searchParams: { range?: string; status?: string; menu?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const range = searchParams.range ?? "7d";
  const status = searchParams.status ?? "all";
  const menu = searchParams.menu ?? "all";

  let q = supabase.from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  if (range === "7d") q = q.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const { data } = await q;

  let rows = (data ?? []) as Row[];
  if (range === "today") {
    const t = torontoDate(new Date());
    rows = rows.filter((o) => torontoDate(o.created_at) === t);
  }

  const MENU_NONE = "__unassigned__";
  // Menu options + item-level breakdown, computed BEFORE the menu filter so the
  // dropdown and the breakdown always show every menu in the current range/status.
  const menuMap = new Map<string, string>();
  const breakdownMap = new Map<string, { label: string; qty: number; revenue: number }>();
  for (const o of rows) {
    for (const it of o.order_items) {
      const key = it.service_snapshot ?? MENU_NONE;
      const label = it.service_snapshot ?? "Unassigned";
      menuMap.set(key, label);
      const cur = breakdownMap.get(key) ?? { label, qty: 0, revenue: 0 };
      cur.qty += Number(it.qty);
      cur.revenue += Number(it.price_snapshot) * Number(it.qty);
      breakdownMap.set(key, cur);
    }
  }
  const menus = [...menuMap.entries()].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  const breakdown = [...breakdownMap.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.revenue - a.revenue);

  // Menu filter is order-level "contains": an order shows if it has any item in the menu.
  const inMenu = (it: Row["order_items"][number]) => (it.service_snapshot ?? MENU_NONE) === menu;
  const viewRows = menu === "all" ? rows : rows.filter((o) => o.order_items.some(inMenu));
  const selectedMenuLabel = menuMap.get(menu);

  return (
    <main className="min-h-screen bg-cream">
      <RealtimeRefresh vendorId={vendor.id} tables={["orders"]} />
      <ReportFilterMemory />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">Order report</h1>
          <a
            href={`/dashboard/report/export?range=${range}&status=${status}&menu=${menu}`}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-ink/90"
          >
            Export CSV
          </a>
        </div>

        <ReportFilters range={range} status={status} menu={menu} ranges={RANGES} statuses={STATUSES} menus={menus} />

        <ReportTable rows={viewRows} menu={menu} menuLabel={selectedMenuLabel} breakdown={breakdown} range={range} status={status} />
      </div>
    </main>
  );
}
