import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
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
      <DashboardNav active="services" />
      <div className="mx-auto max-w-3xl px-4 py-5">
        <h1 className="font-display text-2xl font-bold text-ink">Services</h1>
        <p className="text-ink/60 text-sm mt-1">
          Set up meal services (e.g. Weekday lunch, Weekend specials, Evening snacks). Only <strong>active</strong> services
          show on your page. The date just tells you and your customers which day the service is for.
        </p>

        <AddServiceForm onboarding={onboarding} />

        <div className="mt-5 space-y-2">
          {list.length === 0 && <p className="text-ink/50 py-6 text-center">No services yet — add one above, then add dishes to it under Menu.</p>}
          {list.map((s) => <ServiceRow key={s.id} s={s} />)}
        </div>
      </div>
    </main>
  );
}
