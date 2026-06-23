import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import LiveStamp from "@/components/LiveStamp";
import AddDishForm from "@/components/AddDishForm";
import AddSectionPanel from "@/components/AddSectionPanel";
import MenuDishRow from "@/components/MenuDishRow";
import MenuServiceSection from "@/components/MenuServiceSection";
import PendingButton from "@/components/PendingButton";
import { setServiceSoldOut } from "@/app/actions";
import { formatServiceDates } from "@/lib/format";
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
    <MenuDishRow key={d.id} d={d} services={serviceOpts} today={todayCount.get(d.id) || 0} open={openCount.get(d.id) || 0} vendorLogo={vendor.logo_url} />
  );

  return (
    <main className="min-h-screen bg-cream">
      <RealtimeRefresh vendorId={vendor.id} tables={["orders", "dishes", "services"]} />
      <div className="px-5 pt-2"><LiveStamp at={Date.now()} /></div>
      <div className="mx-auto max-w-3xl px-4 py-5">

        {services.length === 0 ? (
          <AddSectionPanel defaultOpen subtitle="Your food is organised into menus (like Weekday Lunch or Weekend Specials). Create your first menu, then add dishes to it." />
        ) : (
          <>
            <AddSectionPanel subtitle="Your menus & dishes · counts reset daily (ET)" />

            <div className="mt-4">
              <AddDishForm vendorId={vendor.id} services={serviceOpts} onboarding={dishes.length === 0} />
            </div>

            <h2 className="mt-6 font-display text-lg font-bold text-ink">Your menus <span className="text-sm font-normal text-ink/40">· {services.length} {services.length === 1 ? "menu" : "menus"} · {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}{dishes.filter((d) => d.is_sold_out).length > 0 ? ` · ${dishes.filter((d) => d.is_sold_out).length} sold out` : ""}</span></h2>

            {services.map((s) => {
              const list = byService.get(s.id) ?? [];
              const datesLabel = s.service_dates.length ? formatServiceDates(s.service_dates) : (s.available_days?.length ? s.available_days.join(", ") : "");
              const meta = `${list.length} ${list.length === 1 ? "dish" : "dishes"}${datesLabel ? ` · ${datesLabel}` : ""}`;
              const soldOut = list.filter((d) => d.is_sold_out).length;
              const markAll = list.length > 0 ? (
                <>
                  <form action={setServiceSoldOut.bind(null, s.id, true)}>
                    <PendingButton pendingLabel="…" title="Mark this menu sold out" className="rounded-lg border border-chili/25 px-2.5 py-1 text-xs font-semibold text-chili transition hover:bg-chili/10 sm:border-chili/25 max-sm:w-full max-sm:border-0 max-sm:text-left">Mark all sold out</PendingButton>
                  </form>
                  <form action={setServiceSoldOut.bind(null, s.id, false)}>
                    <PendingButton pendingLabel="…" title="Mark this menu available" className="rounded-lg border border-curry/30 px-2.5 py-1 text-xs font-semibold text-curry transition hover:bg-curry/10 max-sm:w-full max-sm:border-0 max-sm:text-left">Mark all available</PendingButton>
                  </form>
                </>
              ) : null;
              return (
                <MenuServiceSection key={s.id} service={s} meta={meta} soldOut={soldOut} markAll={markAll}>
                  {list.length === 0 ? (
                    <p className="rounded-xl bg-white px-4 py-3 text-sm text-ink/40 shadow-card">No dishes in this menu yet — add one above.</p>
                  ) : (
                    list.map(row)
                  )}
                </MenuServiceSection>
              );
            })}

            {unassigned.length > 0 && (
              <section className="mt-3 rounded-2xl border border-line bg-white">
                <div className="px-4 py-3">
                  <span className="font-display text-base font-bold text-ink/60">Unassigned</span>
                  <span className="ml-2 text-xs font-medium text-ink/45">{unassigned.length} {unassigned.length === 1 ? "dish" : "dishes"} · pick a menu</span>
                </div>
                <div className="space-y-2 rounded-b-2xl border-t border-line bg-panel/40 p-3">
                  <p className="text-xs text-ink/45">These dishes have no menu, so they don&rsquo;t show on your page. Pick a menu for each below.</p>
                  {unassigned.map(row)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
