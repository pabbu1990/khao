import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { setVendorStatus } from "@/app/actions";
import PollRefresh from "@/components/PollRefresh";
import LiveStamp from "@/components/LiveStamp";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export default async function AdminVendor({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", params.id).maybeSingle();
  if (!vendor) notFound();
  const v = vendor as Vendor;

  const { data: orders } = await supabase
    .from("orders").select("*").eq("vendor_id", v.id).order("created_at", { ascending: false }).limit(50);
  const rows = (orders ?? []) as Order[];

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
        <Link href="/admin" className="text-spice font-semibold">← Admin</Link>
        <span className="text-cream/60 text-sm">Read-only monitoring</span>
      </header>
      <PollRefresh tables={["orders", "vendors"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{v.name}</h1>
            <Link href={`/${v.slug}`} className="text-sm text-spice">/{v.slug}</Link>
            {v.area && <p className="text-ink/50 text-sm">{v.area}</p>}
          </div>
          <form action={setVendorStatus.bind(null, v.id, v.status === "active" ? "suspended" : "active")}>
            <button className={`rounded-lg px-4 py-2 text-sm font-semibold ${v.status === "active" ? "bg-chili text-white" : "bg-curry text-white"}`}>
              {v.status === "active" ? "Suspend kitchen" : "Reactivate kitchen"}
            </button>
          </form>
        </div>

        <h2 className="mt-6 mb-2 font-semibold text-ink">Recent orders</h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-panel text-ink/60">
              <tr><th className="text-left p-3">Time</th><th className="text-left p-3">Customer</th><th className="text-left p-3">Status</th><th className="text-left p-3">Pay</th><th className="text-right p-3">Total</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-ink/40">No orders yet.</td></tr>}
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-ink/5">
                  <td className="p-3 text-ink/60 whitespace-nowrap">{fmtTime(o.created_at)}</td>
                  <td className="p-3 text-ink">{o.customer_name}</td>
                  <td className="p-3 text-ink/70">{ORDER_STATUS_LABEL[o.status] ?? o.status}</td>
                  <td className="p-3 text-ink/50 capitalize">{o.payment_method}</td>
                  <td className="p-3 text-right text-ink">{money(Number(o.subtotal_cad))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
