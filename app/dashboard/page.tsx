import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ShareLinkPanel from "@/components/ShareLinkPanel";
import ShareLink from "@/components/ShareLink";
import SubmitButton from "@/components/SubmitButton";
import PendingButton from "@/components/PendingButton";
import LiveStamp from "@/components/LiveStamp";
import RecentOrderRow from "@/components/RecentOrderRow";
import { updateOrderStatus, toggleAcceptingOrders } from "@/app/actions";
import OnboardingForm from "@/components/OnboardingForm";
import { money, siteUrl, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type OrderRow = Order & { order_items: OrderItem[] };

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));

export default async function Dashboard({ searchParams }: { searchParams: { done?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) return <OnboardingForm />;
  const justDid = searchParams?.done;

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
  const todayTO = torontoDate(new Date());
  let todayOrders = 0;
  let todayRevenue = 0;
  for (const o of rows) {
    if (torontoDate(o.created_at) !== todayTO) continue;
    if (o.status === "declined" || o.status === "cancelled") continue;
    todayOrders++;
    todayRevenue += Number(o.subtotal_cad);
  }
  const doneToday = done.filter((o) => torontoDate(o.created_at) === todayTO);
  const link = `${siteUrl()}/${vendor.slug}`;

  const { count: servicesCount } = await supabase.from("services").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);
  const { count: dishesCount } = await supabase.from("dishes").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);
  const hasServices = (servicesCount ?? 0) > 0;
  const hasDishes = (dishesCount ?? 0) > 0;
  const setupDone = hasServices && hasDishes;

  return (
    <main className="min-h-screen bg-cream">

      {!setupDone ? (
        <GettingStarted vendorName={vendor.name} hasServices={hasServices} hasDishes={hasDishes} justDid={justDid} />
      ) : (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase text-ink">{vendor.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <LiveStamp at={Date.now()} />
              <a href={`/${vendor.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-spice hover:underline">View my page ↗</a>
            </div>
          </div>
          <form action={toggleAcceptingOrders.bind(null, !vendor.accepting_orders)}>
            <PendingButton
              swap={false}
              type="submit"
              role="switch"
              aria-checked={vendor.accepting_orders}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-2.5 shadow-card transition hover:border-ink/25"
            >
              <span className="text-left">
                <span className={`block text-sm font-bold ${vendor.accepting_orders ? "text-curry" : "text-chili"}`}>
                  {vendor.accepting_orders ? "Accepting orders" : "Orders paused"}
                </span>
                <span className="block text-xs text-ink/45">
                  {vendor.accepting_orders ? "Tap to pause" : "Tap to resume"}
                </span>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${vendor.accepting_orders ? "bg-curry" : "bg-ink/25"}`}>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${vendor.accepting_orders ? "left-[1.375rem]" : "left-0.5"}`} />
              </span>
            </PendingButton>
          </form>
        </div>

        {!vendor.accepting_orders && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-chili/30 bg-chili/[0.06] px-5 py-3">
            <p className="text-sm font-medium text-chili">You&rsquo;re not accepting orders right now — customers can&rsquo;t place an order.</p>
            <form action={toggleAcceptingOrders.bind(null, true)}>
              <PendingButton pendingLabel="…" className="rounded-xl bg-chili px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105">Resume orders</PendingButton>
            </form>
          </div>
        )}

        {justDid === "ready" && (
          <div className="mt-4 rounded-2xl border-2 border-curry/40 bg-curry/[0.06] p-5 shadow-card">
            <p className="font-display text-xl font-bold text-ink">🎉 You&rsquo;re live!</p>
            <p className="mt-1 text-sm text-ink/60">Your kitchen is ready. Share your link with customers — every order lands right here on this dashboard.</p>
            <div className="mt-3"><ShareLink link={link} /></div>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <aside className="space-y-4 lg:col-span-1">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">Today</h2>
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <Stat label="Open orders" value={String(open.length)} />
                <Stat label="Today's orders" value={String(todayOrders)} />
                <Stat label="Today's revenue" value={money(todayRevenue)} />
              </div>
            </div>

            <ShareLinkPanel link={link} />

            {prep.size > 0 && (
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="mb-2 text-sm font-semibold text-ink/70">Prep list <span className="font-normal text-ink/40">· open orders</span></p>
                <div className="flex flex-wrap gap-2">
                  {[...prep.entries()].map(([name, qty]) => (
                    <span key={name} className="rounded-full bg-panel px-3 py-1 text-sm font-medium text-ink">{name} × {qty}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="space-y-6 lg:col-span-2">
            <section>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">Live orders</h2>
              {open.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line bg-white/60 py-10 text-center">
                  {rows.length === 0 ? (
                    <>
                      <p className="font-medium text-ink/70">No orders yet</p>
                      <p className="mt-1 text-sm text-ink/45">Share your ordering link to get your first order.</p>
                      <div className="mx-auto mt-4 max-w-md px-4"><ShareLink link={link} /></div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-ink/70">No open orders right now</p>
                      <p className="mt-1 text-sm text-ink/45">New orders appear here the moment a customer places one.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">{open.map((o) => <OrderCard key={o.id} o={o} />)}</div>
              )}
            </section>

            {doneToday.length > 0 && (
              <section>
                <h2 className="mb-2 font-display text-lg font-bold text-ink/60">Recent <span className="font-normal text-ink/40">· today</span></h2>
                <div className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card">
                  {doneToday.slice(0, 25).map((o) => <RecentOrderRow key={o.id} o={o} />)}
                </div>
                <Link href="/dashboard/report" className="mt-3 inline-block text-sm font-semibold text-spice">See all orders in Report →</Link>
              </section>
            )}
          </div>
        </div>
      </div>
      )}
    </main>
  );
}

function GettingStarted({ vendorName, hasServices, hasDishes, justDid }: { vendorName: string; hasServices: boolean; hasDishes: boolean; justDid?: string }) {
  const step = hasServices ? (hasDishes ? 3 : 2) : 1;
  const doneCount = (hasServices ? 1 : 0) + (hasDishes ? 1 : 0);
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-spice">Step {step} of 3</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Welcome, {vendorName}</h1>
      <p className="mt-1.5 text-ink/60">Let&rsquo;s get your kitchen ready to take orders — three quick steps.</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-spice transition-all" style={{ width: `${(doneCount / 3) * 100}%` }} />
      </div>
      {justDid === "service" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-curry/30 bg-curry/[0.06] px-4 py-2.5 text-sm font-medium text-curry">
          <span aria-hidden="true">✓</span> Service created — now add your dishes.
        </div>
      )}
      <div className="mt-6 space-y-3">
        <SetupStep n={1} done={hasServices} active={!hasServices}
          title="Create a service"
          desc="Group your menu by meal — e.g. Weekday Lunch, Weekend Specials. You can add a date too."
          cta="Create your first service" href="/dashboard/services" />
        <SetupStep n={2} done={hasDishes} active={hasServices && !hasDishes} locked={!hasServices}
          title="Add dishes to your menu"
          desc="Add what you're cooking, with prices and an optional photo."
          cta="Add dishes" href="/dashboard/menu" />
        <SetupStep n={3} done={false} active={false} locked
          title="Share your link with customers"
          desc="Once your menu's ready, share your page on WhatsApp — every order lands right here on this dashboard." />
      </div>
    </div>
  );
}

function SetupStep({ n, done, active, locked, title, desc, cta, href }: { n: number; done: boolean; active?: boolean; locked?: boolean; title: string; desc: string; cta?: string; href?: string }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-card transition ${active ? "border-spice/40 ring-2 ring-spice/15" : "border-line"}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-curry text-white" : active ? "bg-spice text-ink" : "bg-ink/5 text-ink/40"}`}>{done ? "✓" : n}</span>
        <div className="flex-1">
          <p className={`font-display text-lg font-bold ${done || active ? "text-ink" : "text-ink/50"}`}>{title}</p>
          <p className="mt-0.5 text-sm text-ink/55">{desc}</p>
          {active && cta && href && (
            <Link href={href} className="mt-3 inline-block rounded-xl bg-spice px-5 py-2.5 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">{cta} →</Link>
          )}
          {done && <span className="mt-2 inline-block text-sm font-semibold text-curry">Done</span>}
          {locked && !done && <span className="mt-2 inline-block text-sm text-ink/35">Complete the step above first</span>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <p className="text-3xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-ink/50">{label}</p>
    </div>
  );
}

function OrderCard({ o }: { o: OrderRow }) {
  const next: { label: string; status: OrderStatus; primary?: boolean }[] =
    ["placed", "accepted", "ready"].includes(o.status)
      ? [{ label: "Complete", status: "completed", primary: true }, { label: "Decline", status: "declined" }]
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

