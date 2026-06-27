import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PendingButton from "@/components/PendingButton";
import OutreachForm from "@/components/OutreachForm";
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
  const { data: svcRows } = await supabase.from("services").select("vendor_id");
  const { data: dishRows } = await supabase.from("dishes").select("vendor_id");

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

  // ----- analytics (phase 1) -----
  const now = Date.now();
  const WK = 604800000;
  const vWithMenu = new Set((svcRows ?? []).map((r) => r.vendor_id as string));
  const vWithDishes = new Set((dishRows ?? []).map((r) => r.vendor_id as string));
  const vWithOrder = new Set(allOrders.map((o) => o.vendor_id));
  const total = list.length;
  const funnel = [
    { label: "Signed up", n: total },
    { label: "Created a menu", n: list.filter((v) => vWithMenu.has(v.id)).length },
    { label: "Added dishes", n: list.filter((v) => vWithDishes.has(v.id)).length },
    { label: "Got first order", n: list.filter((v) => vWithOrder.has(v.id)).length },
  ];

  const WEEKS = 8;
  const signupsWk = new Array(WEEKS).fill(0);
  for (const v of list) {
    const w = Math.floor((now - new Date(v.created_at).getTime()) / WK);
    if (w >= 0 && w < WEEKS) signupsWk[w]++;
  }
  const gmvWk = new Array(WEEKS).fill(0);
  for (const o of allOrders) {
    if (!counted(o.status)) continue;
    const w = Math.floor((now - new Date(o.created_at).getTime()) / WK);
    if (w >= 0 && w < WEEKS) gmvWk[w] += Number(o.subtotal_cad);
  }
  const weekLabel = (wAgo: number) => (wAgo === 0 ? "now" : `${wAgo}w`);
  const signupSeries = Array.from({ length: WEEKS }, (_, i) => ({ label: weekLabel(WEEKS - 1 - i), value: signupsWk[WEEKS - 1 - i] }));
  const gmvSeries = Array.from({ length: WEEKS }, (_, i) => ({ label: weekLabel(WEEKS - 1 - i), value: gmvWk[WEEKS - 1 - i] }));

  const activePrev = new Set<string>();
  for (const o of allOrders) {
    if (!counted(o.status)) continue;
    const d = (now - new Date(o.created_at).getTime()) / 864e5;
    if (d >= 7 && d < 14) activePrev.add(o.vendor_id);
  }
  const atRisk = list.filter((v) => activePrev.has(v.id) && !active7d.has(v.id));
  const needNudge = list.filter((v) => vWithDishes.has(v.id) && !vWithOrder.has(v.id));
  const topKitchens = [...list]
    .map((v) => ({ v, orders: perCount.get(v.id) || 0, rev: perRevenue.get(v.id) || 0 }))
    .filter((x) => x.orders > 0)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  const proInterested = list
    .filter((v) => v.pro_interest_at)
    .sort((a, b) => (b.pro_interest_at! > a.pro_interest_at! ? 1 : -1));

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
        <span className="font-display font-bold text-spice">KHAO · Admin</span>
        <form action={signOut}><PendingButton className="text-sm text-cream/60" pendingLabel="Signing out…">Sign out</PendingButton></form>
      </header>
      <PollRefresh tables={["orders", "vendors"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>

      <div className="mx-auto max-w-5xl px-4 py-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink/40">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Box label="Kitchens" value={String(list.length)} sub={`${list.filter((v) => v.status === "active").length} active`} />
          <Box label="Active this week" value={String(active7d.size)} sub="took an order (7d)" />
          <Box label="Orders today" value={String(ordersToday)} />
          <Box label="Orders this week" value={String(ordersWeek)} />
          <Box label="GMV (all-time)" value={money(gmv)} sub="all order value" />
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink/40">Analytics</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-ink">Activation funnel</p>
            <p className="text-xs text-ink/40">Where new kitchens drop off</p>
            <div className="mt-3 space-y-2">
              {funnel.map((f) => {
                const pct = total ? Math.round((f.n / total) * 100) : 0;
                return (
                  <div key={f.label}>
                    <div className="flex justify-between text-xs"><span className="text-ink/70">{f.label}</span><span className="text-ink/50">{f.n} · {pct}%</span></div>
                    <div className="mt-0.5 h-2 rounded-full bg-panel"><div className="h-2 rounded-full bg-spice" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-ink">Activity &amp; retention</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-panel/60 p-3"><p className="text-xl font-bold text-ink">{active7d.size}</p><p className="text-xs text-ink/50">active this week</p></div>
              <div className="rounded-lg bg-panel/60 p-3"><p className="text-xl font-bold text-ink">{activePrev.size}</p><p className="text-xs text-ink/50">active last week</p></div>
            </div>
            {atRisk.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-chili">At risk — went quiet ({atRisk.length})</p>
                <p className="mt-0.5 text-xs text-ink/60">{atRisk.slice(0, 6).map((v) => v.name).join(", ")}{atRisk.length > 6 ? "…" : ""}</p>
              </div>
            )}
            {needNudge.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-spice">Has a menu, no orders yet ({needNudge.length})</p>
                <p className="mt-0.5 text-xs text-ink/60">{needNudge.slice(0, 6).map((v) => v.name).join(", ")}{needNudge.length > 6 ? "…" : ""}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-ink">New kitchens / week</p>
            <MiniBars data={signupSeries} />
          </div>

          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-ink">GMV / week</p>
            <MiniBars data={gmvSeries} money />
          </div>

          <div className="rounded-xl bg-white p-4 shadow-card lg:col-span-2">
            <p className="text-sm font-semibold text-ink">Top kitchens</p>
            {topKitchens.length === 0 ? (
              <p className="mt-2 text-xs text-ink/40">No orders yet.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {topKitchens.map((x, i) => (
                  <div key={x.v.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink"><span className="text-ink/40">{i + 1}.</span> {x.v.name}</span>
                    <span className="text-ink/60">{x.orders} orders · {money(x.rev)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">Pro interest <span className="text-ink/40">({proInterested.length})</span></p>
              <span className="rounded-full bg-spice/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#9a5a14]">Card payments</span>
            </div>
            <p className="text-xs text-ink/40">Vendors who tapped &ldquo;I&rsquo;m interested&rdquo; on Pro card payments</p>
            {proInterested.length === 0 ? (
              <p className="mt-2 text-xs text-ink/40">No interest yet.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {proInterested.slice(0, 10).map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span><Link href={`/admin/vendor/${v.id}`} className="font-semibold text-ink hover:text-spice">{v.name}</Link> <span className="text-ink/40">/{v.slug}</span></span>
                    <span className="whitespace-nowrap text-xs text-ink/50">{relative(v.pro_interest_at!)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink/40">Kitchens</h2>
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

        <h2 className="mt-8 mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink/40">Tools</h2>
        <details className="group rounded-xl border border-line bg-white">
          <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3 font-display font-bold text-ink">
            Send outreach email
            <span className="text-ink/40 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
          </summary>
          <div className="border-t border-line p-4"><OutreachForm /></div>
        </details>
      </div>
    </main>
  );
}

function MiniBars({ data, money: isMoney }: { data: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-3">
      <div className="flex items-end gap-1.5" style={{ height: 70 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 rounded-t bg-spice/70" style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }} title={`${d.label}: ${isMoney ? "$" + Math.round(d.value) : d.value}`} />
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d, i) => <span key={i} className="flex-1 text-center text-[10px] text-ink/35">{d.label}</span>)}
      </div>
    </div>
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
