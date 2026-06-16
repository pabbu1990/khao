import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardNav from "@/components/DashboardNav";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import ShareLink from "@/components/ShareLink";
import SubmitButton from "@/components/SubmitButton";
import LiveStamp from "@/components/LiveStamp";
import { updateOrderStatus, toggleAcceptingOrders } from "@/app/actions";
import OnboardingForm from "@/components/OnboardingForm";
import { money, siteUrl, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OrderRow = Order & { order_items: OrderItem[] };

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) return <OnboardingForm />;

  const { data: orders } = await supabase
    .from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false }).limit(100);

  const rows = (orders ?? []) as OrderRow[];
  const open = rows.filter((o) => ["placed", "accepted", "ready"].includes(o.status));
  const done = rows.filter((o) => ["completed", "declined", "cancelled"].includes(o.status));

  const prep = new Map<string, number>();
  for (const o of open) for (const it of o.order_items) {
    const key = it.service_snapshot ? `${it.service_snapshot} · ${it.name_snapshot}` : it.name_snapshot;
    prep.set(key, (prep.get(key) || 0) + it.qty);
  }
  const dayTotal = open.reduce((s, o) => s + Number(o.subtotal_cad), 0);
  const link = `${siteUrl()}/${vendor.slug}`;

  const { count: servicesCount } = await supabase.from("services").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);
  const { count: dishesCount } = await supabase.from("dishes").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);
  const setupDone = (servicesCount ?? 0) > 0 && (dishesCount ?? 0) > 0;

  return (
    <main className="min-h-screen bg-cream">
      <DashboardNav active="orders" />
      <RealtimeRefresher vendorId={vendor.id} />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">{vendor.name}</h1>
            <div className="mt-1"><LiveStamp at={Date.now()} /></div>
          </div>
          <form action={toggleAcceptingOrders.bind(null, !vendor.accepting_orders)}>
            <button className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${vendor.accepting_orders ? "bg-curry/15 text-curry hover:bg-curry/20" : "bg-chili/15 text-chili hover:bg-chili/20"}`}>
              <span className={`h-2 w-2 rounded-full ${vendor.accepting_orders ? "bg-curry" : "bg-chili"}`} />
              {vendor.accepting_orders ? "Accepting orders — tap to pause" : "Paused — tap to resume"}
            </button>
          </form>
        </div>

        {!setupDone && (
          <div className="mt-5 rounded-2xl border border-spice/30 bg-white p-5 shadow-card">
            <h2 className="font-display text-lg font-bold text-ink">Finish setting up your kitchen</h2>
            <p className="mt-0.5 text-sm text-ink/50">A few quick steps to start taking orders.</p>
            <ol className="mt-3 space-y-2.5">
              <Step done={(servicesCount ?? 0) > 0} href="/dashboard/services" n={1} label="Create a service (e.g. Weekday Lunch)" />
              <Step done={(dishesCount ?? 0) > 0} href="/dashboard/menu" n={2} label="Add dishes to your menu" />
              <Step done={false} n={3} label="Share your link with customers (below)" />
            </ol>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-spice/30 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Your ordering link</h2>
            <span className="rounded-full bg-spice/15 px-2.5 py-0.5 text-xs font-semibold text-spice">Share with customers</span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink/55">
            This is your kitchen&rsquo;s page. Send it to your customers — drop it in your WhatsApp groups, status, or chats.
            They tap it to browse your menu and order, and every order lands right here on this dashboard.
          </p>
          <div className="mt-3"><ShareLink link={link} /></div>
        </div>

        <div className="mt-5 grid max-w-sm grid-cols-2 gap-3">
          <Stat label="Open orders" value={String(open.length)} />
          <Stat label="Open total" value={money(dayTotal)} />
        </div>

        {prep.size > 0 && (
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-semibold text-ink/70">Prep list <span className="font-normal text-ink/40">· open orders</span></p>
            <div className="flex flex-wrap gap-2">
              {[...prep.entries()].map(([name, qty]) => (
                <span key={name} className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-ink">{name} × {qty}</span>
              ))}
            </div>
          </div>
        )}

        <section className="mt-6">
          <h2 className="mb-3 font-display text-xl font-bold text-ink">Live orders</h2>
          {open.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/60 py-12 text-center">
              <p className="font-medium text-ink/70">No open orders yet</p>
              <p className="mt-1 text-sm text-ink/45">New orders appear here the moment a customer places one.</p>
            </div>
          ) : (
            <div className="space-y-3">{open.map((o) => <OrderCard key={o.id} o={o} />)}</div>
          )}
        </section>

        {done.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 font-display text-lg font-bold text-ink/60">Recent</h2>
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card">
              {done.slice(0, 15).map((o) => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-ink/70">{o.customer_name} <span className="text-ink/35">· {o.order_items.reduce((s, it) => s + it.qty, 0)} items</span></span>
                  <span className="text-ink/50">{ORDER_STATUS_LABEL[o.status]} · {money(Number(o.subtotal_cad))}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Step({ done, href, n, label }: { done: boolean; href?: string; n: number; label: string }) {
  const inner = (
    <span className="flex items-center gap-3">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${done ? "bg-curry text-white" : "bg-spice/15 text-spice"}`}>{done ? "✓" : n}</span>
      <span className={`text-sm ${done ? "text-ink/40 line-through" : "font-medium text-ink"}`}>{label}</span>
    </span>
  );
  return <li>{href ? <Link href={href} className="transition hover:opacity-80">{inner}</Link> : inner}</li>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-2xl font-bold text-ink">{value}</p>
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
  const badge = o.status === "placed" ? "bg-spice/15 text-spice" : o.status === "ready" ? "bg-curry/15 text-curry" : "bg-ink/10 text-ink/60";

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{o.customer_name} <span className="font-normal text-ink/40">· {o.customer_phone}</span></p>
          <p className="mt-0.5 text-sm capitalize text-ink/50">
            {o.fulfilment}{o.requested_time ? ` · ${o.requested_time}` : ""} · {o.payment_label ?? (o.payment_method === "online" ? "Paid online" : "Pay direct")}
          </p>
          {o.customer_address && <p className="text-sm text-ink/50">{o.customer_address}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{ORDER_STATUS_LABEL[o.status]}</span>
      </div>

      <ul className="mt-3 space-y-0.5 text-sm text-ink/80">
        {o.order_items.map((it) => (
          <li key={it.id}>{it.qty} × {it.name_snapshot}{it.service_snapshot && <span className="text-ink/40"> · {it.service_snapshot}</span>}</li>
        ))}
      </ul>
      {o.customer_note && <p className="mt-2 rounded-lg bg-panel px-3 py-2 text-sm italic text-ink/60">&ldquo;{o.customer_note}&rdquo;</p>}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-lg font-bold text-ink">{money(Number(o.subtotal_cad))}</span>
        <div className="flex gap-2">
          {next.map((n) => (
            <form key={n.status} action={updateOrderStatus.bind(null, o.id, n.status)}>
              <SubmitButton className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${n.primary ? "bg-spice text-ink hover:brightness-[1.04]" : "border border-line text-ink/60 hover:border-ink/25"}`}>{n.label}</SubmitButton>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

