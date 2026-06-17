import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import LiveStamp from "@/components/LiveStamp";
import AddDishForm from "@/components/AddDishForm";
import MenuDishRow from "@/components/MenuDishRow";
import PendingButton from "@/components/PendingButton";
import { setAllSoldOut } from "@/app/actions";
import type { Dish, Service } from "@/lib/types";

export const dynamic = "force-dynamic";

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));

export default async function MenuPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const { data: servicesData } = await supabase
    .from("services").select("*").eq("vendor_id", vendor.id).order("sort_order").order("created_at");
  const services = (servicesData ?? []) as Service[];
  const serviceOpts = services.map((s) => ({ id: s.id, name: s.name }));

  const { data: dishesData } = await supabase.from("dishes").select("*").eq("vendor_id", vendor.id).order("created_at");
  const dishes = (dishesData ?? []) as Dish[];

  // Per-dish order counts: "today" (Toronto) and "open orders".
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data: ordersData } = await supabase
    .from("orders")
    .select("status,created_at,order_items(dish_id,qty)")
    .eq("vendor_id", vendor.id)
    .gte("created_at", since);

  const todayTO = torontoDate(new Date());
  const todayCount = new Map<string, number>();
  const openCount = new Map<string, number>();
  for (const o of (ordersData ?? []) as { status: string; created_at: string; order_items: { dish_id: string | null; qty: number }[] }[]) {
    if (o.status === "declined" || o.status === "cancelled") continue;
    const isToday = torontoDate(o.created_at) === todayTO;
    const isOpen = o.status === "placed" || o.status === "accepted" || o.status === "ready";
    for (const it of o.order_items) {
      if (!it.dish_id) continue;
      if (isToday) todayCount.set(it.dish_id, (todayCount.get(it.dish_id) || 0) + it.qty);
      if (isOpen) openCount.set(it.dish_id, (openCount.get(it.dish_id) || 0) + it.qty);
    }
  }

  const byService = new Map<string, Dish[]>();
  const unassigned: Dish[] = [];
  for (const d of dishes) {
    if (d.service_id && services.some((s) => s.id === d.service_id)) {
      const arr = byService.get(d.service_id) ?? [];
      arr.push(d);
      byService.set(d.service_id, arr);
    } else {
      unassigned.push(d);
    }
  }

  const row = (d: Dish) => (
    <MenuDishRow key={d.id} d={d} services={serviceOpts} today={todayCount.get(d.id) || 0} open={openCount.get(d.id) || 0} />
  );

  return (
    <main className="min-h-screen bg-cream">
      <RealtimeRefresh vendorId={vendor.id} tables={["orders", "dishes", "services"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>
      <div className="mx-auto max-w-3xl px-4 py-5">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-bold text-ink">Menu</h1>
          <p className="text-xs text-ink/40">Counts reset daily (Ottawa time)</p>
        </div>

        {dishes.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink/45">Quick:</span>
            <form action={setAllSoldOut.bind(null, true)}>
              <PendingButton pendingLabel="…" className="rounded-lg border border-chili/25 px-3 py-1.5 text-xs font-semibold text-chili transition hover:bg-chili/10">Mark all sold out</PendingButton>
            </form>
            <form action={setAllSoldOut.bind(null, false)}>
              <PendingButton pendingLabel="…" className="rounded-lg border border-curry/30 px-3 py-1.5 text-xs font-semibold text-curry transition hover:bg-curry/10">Mark all available</PendingButton>
            </form>
          </div>
        )}

        {services.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-6 text-center shadow-card">
            <p className="text-ink/70">Create a service first — every dish belongs to a service.</p>
            <Link href="/dashboard/services" className="mt-3 inline-block rounded-lg bg-spice px-4 py-2 font-semibold text-ink">
              Set up a service
            </Link>
          </div>
        ) : (
          <AddDishForm vendorId={vendor.id} services={serviceOpts} onboarding={dishes.length === 0} />
        )}

        {services.map((s) => {
          const list = byService.get(s.id) ?? [];
          return (
            <section key={s.id} className="mt-6">
              <h2 className="font-display text-lg font-bold text-ink">
                {s.name}
                {!s.is_active && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink/50">Off</span>}
              </h2>
              {list.length === 0 ? (
                <p className="text-sm text-ink/40 mt-1">No dishes in this service yet.</p>
              ) : (
                <div className="mt-2 space-y-2">{list.map(row)}</div>
              )}
            </section>
          );
        })}

        {unassigned.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-lg font-bold text-ink/60">Unassigned</h2>
            <p className="text-sm text-ink/40">Pick a service for these so they appear on your page.</p>
            <div className="mt-2 space-y-2">{unassigned.map(row)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
