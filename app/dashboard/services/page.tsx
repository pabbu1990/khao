import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { addService } from "@/app/actions";
import ServiceRow from "@/components/ServiceRow";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";


export default async function ServicesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const { data: services } = await supabase
    .from("services").select("*").eq("vendor_id", vendor.id).order("sort_order").order("created_at");
  const list = (services ?? []) as Service[];

  return (
    <main className="min-h-screen bg-cream">
      <DashboardNav active="services" />
      <div className="mx-auto max-w-3xl px-4 py-5">
        <h1 className="font-display text-2xl font-bold text-ink">Services</h1>
        <p className="text-ink/60 text-sm mt-1">
          Set up meal services (e.g. Weekday lunch, Weekend specials, Evening snacks). Only <strong>active</strong> services
          show on your page. The date just tells you and your customers which day the service is for.
        </p>

        <form action={addService} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-card">
          <input name="name" required placeholder="Service name (e.g. Weekday Lunch)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
          <input name="description" placeholder="Short description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
          <label className="block">
            <span className="text-sm font-medium text-ink/70">Service date <span className="text-ink/40">(optional)</span></span>
            <input type="date" name="service_date" className="mt-1 block w-full rounded-lg border border-ink/15 px-3 py-2" />
          </label>
          <button className="rounded-lg bg-spice px-4 py-2 font-semibold text-ink">Add service</button>
        </form>

        <div className="mt-5 space-y-2">
          {list.length === 0 && <p className="text-ink/50 py-6 text-center">No services yet — add one above, then add dishes to it under Menu.</p>}
          {list.map((s) => <ServiceRow key={s.id} s={s} />)}
        </div>
      </div>
    </main>
  );
}
