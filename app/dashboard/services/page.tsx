import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServiceRow from "@/components/ServiceRow";
import AddServiceForm from "@/components/AddServiceForm";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";


export default async function ServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const { data: services } = await supabase
    .from("services").select("*").eq("vendor_id", vendor.id).order("sort_order").order("created_at");
  const list = (services ?? []) as Service[];

  // First-run onboarding: until the kitchen has at least one dish, adding a
  // service should guide them back to the dashboard to continue the steps.
  const { count: dishCount } = await supabase.from("dishes").select("*", { count: "exact", head: true }).eq("vendor_id", vendor.id);
  const onboarding = (dishCount ?? 0) === 0;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-5">
        <h1 className="font-display text-2xl font-bold text-ink">Services</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/55">
          Group your menu by meal — e.g. Weekday Lunch, Weekend Specials. Only <strong className="font-semibold text-ink/70">active</strong> services show on your page; the date tells customers which day it&rsquo;s for.
        </p>

        <div className="mt-5">
          <AddServiceForm onboarding={onboarding} />
        </div>

        <div className="mt-5 space-y-2">
          {list.length === 0 && <p className="text-ink/50 py-6 text-center">No services yet — add one above, then add dishes to it under Menu.</p>}
          {list.map((s) => <ServiceRow key={s.id} s={s} />)}
        </div>
      </div>
    </main>
  );
}
