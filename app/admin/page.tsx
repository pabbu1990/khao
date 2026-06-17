import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PendingButton from "@/components/PendingButton";
import Link from "next/link";
import { signOut } from "@/app/actions";
import PollRefresh from "@/components/PollRefresh";
import LiveStamp from "@/components/LiveStamp";
import { money } from "@/lib/format";
import type { Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));
const shortDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", month: "short", day: "numeric" }).format(new Date(iso));
function relative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  const w = Math.floor(days / 7);
  return w <= 1 ? "1w ago" : `${w}w ago`;
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: vendors } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
  const { data: orders } = await supabase.from("orders").select("vendor_id,status,subtotal_cad,created_at");

  const list = (vendors ?? []) as Vendor[];
  const allOrders = orders ?? [];

  const todayTO = torontoDate(new Date());
  const weekAgo = Date.now() - 7 * 864e5;
  const counted = (s: string) => s !== "declined" && s !== "cancelled";

  let ordersToday = 0;
  let ordersWeek = 0;
  let gmv = 0;
  const active7d = new Set<string>();
  const perCount = new Map<string, number>();
  const perRevenue = new Map<string, number>();
  const perLast = new Map<string, string>();

  for (const o of allOrders) {
    perCount.set(o.vendor_id, (perCount.get(o.vendor_id) || 0) + 1);
    if (o.status === "completed") perRevenue.set(o.vendor_id, (perRevenue.get(o.vendor_id) || 0) + Number(o.subtotal_cad));
    const prevLast = perLast.get(o.vendor_id);
    if (!prevLast || o.created_at > prevLast) perLast.set(o.vendor_id, o.created_at);
    if (counted(o.status)) gmv += Number(o.subtotal_cad);
    if (torontoDate(o.created_at) === todayTO) ordersToday++;
    if (new Date(o.created_at).getTime() >= weekAgo) {
      ordersWeek++;
      active7d.add(o.vendor_id);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
        <span className="font-display font-bold text-spice">KHAO · Admin</span>
        <form action={signOut}><PendingButton className="text-sm text-cream/60" pendingLabel="Signing out…">Sign out</PendingButton></form>
      </header>
      <PollRefresh tables={["orders", "vendors"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>

      <div className="mx-auto max-w-5xl px-4 py-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Box label="Kitchens" value={String(list.length)} sub={`${list.filter((v) => v.status === "active").length} active`} />
          <Box label="Active this week" value={String(active7d.size)} sub="took an order (7d)" />
          <Box label="Orders today" value={String(ordersToday)} />
          <Box label="Orders this week" value={String(ordersWeek)} />
          <Box label="GMV (all-time)" value={money(gmv)} sub="all order value" />
        </div>

        <h1 className="mt-6 mb-2 font-semibold text-ink">All kitchens</h1>
        <div className="overflow-x-auto rounded-xl bg-white shadow-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-panel text-ink/60">
              <tr>
                <th className="p-3 text-left">Kitchen</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Joined</th>
                <th className="p-3 text-left">Last order</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink/40">No kitchens yet.</td></tr>}
              {list.map((v) => {
                const last = perLast.get(v.id);
                return (
                  <tr key={v.id} className="border-t border-ink/5">
                    <td className="p-3"><p className="font-semibold text-ink">{v.name}</p><p className="text-ink/40">/{v.slug}</p></td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.status === "active" ? "bg-curry/15 text-curry" : "bg-chili/15 text-chili"}`}>{v.status}</span>
                    </td>
                    <td className="p-3 text-ink/70 whitespace-nowrap">{shortDate(v.created_at)}</td>
                    <td className="p-3 text-ink/70 whitespace-nowrap">{last ? relative(last) : "—"}</td>
                    <td className="p-3 text-right text-ink">{perCount.get(v.id) || 0}</td>
                    <td className="p-3 text-right text-ink">{money(perRevenue.get(v.id) || 0)}</td>
                    <td className="p-3 text-right"><Link href={`/admin/vendor/${v.id}`} className="text-spice font-semibold">View</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Box({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs font-semibold text-ink/60">{label}</p>
      {sub && <p className="text-[11px] text-ink/40">{sub}</p>}
    </div>
  );
}
