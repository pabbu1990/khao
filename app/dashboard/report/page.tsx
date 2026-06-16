import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import LiveStamp from "@/components/LiveStamp";
import { setPaymentStatus } from "@/app/actions";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";
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
  { key: "accepted", label: "Accepted" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export default async function ReportPage({ searchParams }: { searchParams: { range?: string; status?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const range = searchParams.range ?? "7d";
  const status = searchParams.status ?? "all";

  let q = supabase.from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  if (range === "7d") q = q.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const { data } = await q;

  let rows = (data ?? []) as Row[];
  if (range === "today") {
    const t = torontoDate(new Date());
    rows = rows.filter((o) => torontoDate(o.created_at) === t);
  }

  const total = rows.reduce((s, o) => s + Number(o.subtotal_cad), 0);
  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? "bg-spice text-ink" : "bg-white text-ink/60 border border-ink/10"}`;

  return (
    <main className="min-h-screen bg-cream">
      <DashboardNav active="report" />
      <RealtimeRefresh vendorId={vendor.id} tables={["orders"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">Order report</h1>
          <a
            href={`/dashboard/report/export?range=${range}&status=${status}`}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-cream"
          >
            Export CSV
          </a>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Link key={r.key} href={`/dashboard/report?range=${r.key}&status=${status}`} className={chip(range === r.key)}>{r.label}</Link>
          ))}
          <span className="mx-1 text-ink/20">|</span>
          {STATUSES.map((s) => (
            <Link key={s.key} href={`/dashboard/report?range=${range}&status=${s.key}`} className={chip(status === s.key)}>{s.label}</Link>
          ))}
        </div>

        <p className="mt-3 text-sm text-ink/60">{rows.length} order{rows.length === 1 ? "" : "s"} · {money(total)} total</p>

        <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-card">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-panel text-ink/60">
              <tr>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Payment</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-ink/40">No orders for this filter.</td></tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-ink/5 align-top">
                  <td className="p-3 whitespace-nowrap text-ink/70">{fmtTime(o.created_at)}</td>
                  <td className="p-3">
                    <p className="font-semibold text-ink">{o.customer_name}</p>
                    <p className="text-ink/50 capitalize">{o.fulfilment}</p>
                  </td>
                  <td className="p-3 text-ink/70">
                    <p>{o.customer_phone}</p>
                    {o.customer_email && <p className="text-ink/50">{o.customer_email}</p>}
                  </td>
                  <td className="p-3 text-ink/60">{o.customer_address || "—"}</td>
                  <td className="p-3 text-ink/80">
                    {o.order_items.map((it) => (
                      <div key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot ? <span className="text-ink/40"> · {it.service_snapshot}</span> : null}</div>
                    ))}
                  </td>
                  <td className="p-3 text-right font-semibold text-ink whitespace-nowrap">{money(Number(o.subtotal_cad))}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-spice/15 px-2 py-0.5 text-xs font-semibold text-ink">{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
                  </td>
                  <td className="p-3">
                    <p className="text-ink/70">{o.payment_label ?? o.payment_method}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.payment_status === "paid" ? "bg-curry/15 text-curry" : "bg-chili/15 text-chili"}`}>
                        {o.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </span>
                      <form action={setPaymentStatus.bind(null, o.id, o.payment_status === "paid" ? "unpaid" : "paid")}>
                        <button className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-ink/70 transition hover:bg-panel">
                          {o.payment_status === "paid" ? "Mark unpaid" : "Mark paid"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
