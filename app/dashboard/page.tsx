import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ShareLinkPanel from "@/components/ShareLinkPanel";
import ShareLink from "@/components/ShareLink";
import PendingButton from "@/components/PendingButton";
import LiveStamp from "@/components/LiveStamp";
import LiveOrders from "@/components/LiveOrders";
import RecentOrderRow from "@/components/RecentOrderRow";
import { toggleAcceptingOrders } from "@/app/actions";
import OnboardingForm from "@/components/OnboardingForm";
import { money, siteUrl } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

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

  // Open orders: all of them (never capped) so a busy kitchen can't lose one.
  const { data: openData } = await supabase
    .from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id)
    .in("status", ["placed", "accepted", "ready"]).order("created_at", { ascending: true }).limit(500);
  const open = (openData ?? []) as OrderRow[];

  // Recent window (48h) for today's stats + the "Recent · today" list.
  const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: recentData } = await supabase
    .from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id)
    .gte("created_at", since48h).order("created_at", { ascending: false }).limit(1000);
  const recent = (recentData ?? []) as OrderRow[];

  // Has this kitchen ever had an order? (drives the empty state)
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);

  const prep = new Map<string, number>();
  for (const o of open) for (const it of o.order_items) {
    const key = it.service_snapshot ? `${it.service_snapshot} · ${it.name_snapshot}` : it.name_snapshot;
    prep.set(key, (prep.get(key) || 0) + it.qty);
  }
  const todayTO = torontoDate(new Date());
  let todayOrders = 0;
  let todayRevenue = 0;
  for (const o of recent) {
    if (torontoDate(o.created_at) !== todayTO) continue;
    if (o.status === "declined" || o.status === "cancelled") continue;
    todayOrders++;
    todayRevenue += Number(o.subtotal_cad);
  }
  const doneToday = recent.filter((o) => ["completed", "declined", "cancelled"].includes(o.status) && torontoDate(o.created_at) === todayTO);
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
      <div className="mx-auto max-w-4xl px-4 py-6">
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

        <ShareLinkPanel link={link} />

        <div className="mt-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">Today</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <Stat label="Needs action" value={String(open.length)} accent={open.length > 0} />
            <Stat label="Today's orders" value={String(todayOrders)} />
            <Stat label="Today's revenue" value={money(todayRevenue)} />
          </div>
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
          {open.length === 0 ? (
            <>
              <h2 className="mb-3 font-display text-xl font-bold text-ink">Live orders</h2>
              <div className="rounded-2xl border border-dashed border-line bg-white/60 py-10 text-center">
                {(totalOrders ?? 0) === 0 ? (
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
            </>
          ) : (
            <LiveOrders orders={open} />
          )}
        </section>

        {doneToday.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 font-display text-lg font-bold text-ink/60">Recent <span className="font-normal text-ink/40">· today</span></h2>
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card">
              {doneToday.slice(0, 25).map((o) => <RecentOrderRow key={o.id} o={o} />)}
            </div>
            <Link href="/dashboard/report" className="mt-3 inline-block text-sm font-semibold text-spice">See all orders in Report →</Link>
          </section>
        )}
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
      <span className="inline-flex items-center gap-2 rounded-full border border-curry/30 bg-curry/[0.1] px-3.5 py-1.5 text-sm font-semibold text-curry">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-curry text-white">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        Kitchen created
      </span>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-spice">Step {step} of 3</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Welcome to Khao!</h1>
      <p className="mt-1.5 text-ink/60"><span className="font-semibold text-ink/80">{vendorName}</span> is set up. Let&rsquo;s get it ready to take orders — three quick steps.</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-spice transition-all" style={{ width: `${(doneCount / 3) * 100}%` }} />
      </div>
      {justDid === "service" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-curry/30 bg-curry/[0.06] px-4 py-2.5 text-sm font-medium text-curry">
          <span aria-hidden="true">✓</span> Menu created — now add your dishes.
        </div>
      )}
      <div className="mt-6 space-y-3">
        <SetupStep n={1} done={hasServices} active={!hasServices}
          title="Create a menu"
          desc="Group your food by meal — e.g. Weekday Lunch, Weekend Specials. You can add a date too."
          cta="Create your first menu" href="/dashboard/menu" />
        <SetupStep n={2} done={hasDishes} active={hasServices && !hasDishes} locked={!hasServices}
          title="Add dishes to your menus"
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-card sm:block ${accent ? "border border-spice" : ""}`}>
      <p className="text-xl font-bold leading-tight text-ink sm:text-2xl">{value}</p>
      <p className="text-xs text-ink/50 sm:mt-0.5">{label}</p>
    </div>
  );
}
