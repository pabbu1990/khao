import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import LiveStamp from "@/components/LiveStamp";
import { createVendor, updateOrderStatus } from "@/app/actions";
import { money, siteUrl, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OrderRow = Order & { order_items: OrderItem[] };

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).maybeSingle();

  if (!vendor) {
    return <Onboarding />;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (orders ?? []) as OrderRow[];
  const open = rows.filter((o) => ["placed", "accepted", "ready"].includes(o.status));
  const done = rows.filter((o) => ["completed", "declined", "cancelled"].includes(o.status));

  // Prep list across open orders
  const prep = new Map<string, number>();
  for (const o of open) for (const it of o.order_items) {
    const key = it.service_snapshot ? `${it.service_snapshot} · ${it.name_snapshot}` : it.name_snapshot;
    prep.set(key, (prep.get(key) || 0) + it.qty);
  }
  const dayTotal = open.reduce((s, o) => s + Number(o.subtotal_cad), 0);

  const link = `${siteUrl()}/${vendor.slug}`;

  return (
    <main className="min-h-screen bg-cream">
      <DashboardNav active="orders" />
      <RealtimeRefresher vendorId={vendor.id} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{vendor.name}</h1>
            <Link href={`/${vendor.slug}`} className="text-sm text-spice">{link}</Link>
          </div>
          <div className="flex gap-3">
            <Stat label="Open orders" value={String(open.length)} />
            <Stat label="Open total" value={money(dayTotal)} />
          </div>
        </div>

        {prep.size > 0 && (
          <div className="mt-4 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-semibold text-ink/70 mb-2">Prep list (open orders)</p>
            <div className="flex flex-wrap gap-2">
              {[...prep.entries()].map(([name, qty]) => (
                <span key={name} className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-ink">{name} × {qty}</span>
              ))}
            </div>
          </div>
        )}

        <h2 className="mt-6 mb-2 font-semibold text-ink">Live orders</h2>
        {open.length === 0 && <p className="text-ink/50 py-8 text-center rounded-xl bg-white">No open orders. New orders appear here instantly.</p>}
        <div className="space-y-3">
          {open.map((o) => <OrderCard key={o.id} o={o} />)}
        </div>

        {done.length > 0 && (
          <>
            <h2 className="mt-8 mb-2 font-semibold text-ink/60">Recent (closed)</h2>
            <div className="space-y-2">
              {done.slice(0, 15).map((o) => (
                <div key={o.id} className="flex justify-between rounded-lg bg-white/60 px-4 py-2 text-sm text-ink/60">
                  <span>{o.customer_name} · {o.order_items.reduce((s, it) => s + it.qty, 0)} items</span>
                  <span>{ORDER_STATUS_LABEL[o.status]} · {money(Number(o.subtotal_cad))}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-4 py-2 text-center shadow-card">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}

function OrderCard({ o }: { o: OrderRow }) {
  const next: { label: string; status: OrderStatus; primary?: boolean }[] =
    o.status === "placed" ? [{ label: "Accept", status: "accepted", primary: true }, { label: "Decline", status: "declined" }]
    : o.status === "accepted" ? [{ label: "Mark ready", status: "ready", primary: true }]
    : o.status === "ready" ? [{ label: "Complete", status: "completed", primary: true }]
    : [];

  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-ink">{o.customer_name} <span className="text-ink/40 font-normal">· {o.customer_phone}</span></p>
          <p className="text-sm text-ink/50 capitalize">
            {o.fulfilment}{o.requested_time ? ` · ${o.requested_time}` : ""} · {o.payment_label ?? (o.payment_method === "online" ? "Paid online" : "Pay direct")}
          </p>
          {o.customer_address && <p className="text-sm text-ink/50">{o.customer_address}</p>}
        </div>
        <span className="rounded-full bg-spice/15 px-3 py-1 text-xs font-semibold text-ink">{ORDER_STATUS_LABEL[o.status]}</span>
      </div>

      <ul className="mt-2 text-sm text-ink/80">
        {o.order_items.map((it) => (
          <li key={it.id}>
            {it.qty} × {it.name_snapshot}
            {it.service_snapshot && <span className="text-ink/40"> · {it.service_snapshot}</span>}
          </li>
        ))}
      </ul>
      {o.customer_note && <p className="mt-1 text-sm italic text-ink/60">“{o.customer_note}”</p>}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold text-ink">{money(Number(o.subtotal_cad))}</span>
        <div className="flex gap-2">
          {next.map((n) => (
            <form key={n.status} action={updateOrderStatus.bind(null, o.id, n.status)}>
              <button className={`rounded-lg px-4 py-2 text-sm font-semibold ${n.primary ? "bg-spice text-ink" : "border border-ink/15 text-ink/60"}`}>
                {n.label}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

function Onboarding() {
  return (
    <main className="min-h-screen bg-ink text-cream flex items-center justify-center px-6">
      <form action={createVendor} className="w-full max-w-md space-y-3">
        <p className="text-spice font-semibold tracking-[0.3em] text-xs">KHAO</p>
        <h1 className="font-display text-3xl font-bold">Set up your kitchen</h1>
        <p className="text-cream/70 text-sm">This creates your public ordering page. Your link is made from your kitchen name — you can change it, your hours and payment details later in Settings.</p>
        <input name="name" required placeholder="Kitchen name (e.g. Spice Divine)" className="w-full rounded-lg bg-white px-4 py-3 text-ink" />
        <input name="area" placeholder="Area (e.g. Barrhaven)" className="w-full rounded-lg bg-white px-4 py-3 text-ink" />
        <button className="w-full rounded-lg bg-spice px-4 py-3 font-semibold text-ink">Create my kitchen</button>
      </form>
    </main>
  );
}
