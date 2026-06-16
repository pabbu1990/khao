import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { addService, toggleServiceActive, deleteService } from "@/app/actions";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
          show on your page. Leave days empty to show whenever active, or pick days to limit it (e.g. weekend only).
        </p>

        <form action={addService} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-card">
          <input name="name" required placeholder="Service name (e.g. Weekday Lunch)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
          <input name="description" placeholder="Short description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
          <div>
            <p className="text-sm font-medium text-ink/70 mb-1">Available days (optional)</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-2.5 py-1 text-sm">
                  <input type="checkbox" name="days" value={d} /> {d}
                </label>
              ))}
            </div>
          </div>
          <button className="rounded-lg bg-spice px-4 py-2 font-semibold text-ink">Add service</button>
        </form>

        <div className="mt-5 space-y-2">
          {list.length === 0 && <p className="text-ink/50 py-6 text-center">No services yet — add one above, then add dishes to it under Menu.</p>}
          {list.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
              <div className="flex-1">
                <p className="font-semibold text-ink">
                  {s.name}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_active ? "bg-curry/15 text-curry" : "bg-ink/10 text-ink/50"}`}>
                    {s.is_active ? "Active" : "Off"}
                  </span>
                </p>
                {s.description && <p className="text-sm text-ink/50">{s.description}</p>}
                <p className="text-xs text-ink/40 mt-0.5">{s.available_days.length ? s.available_days.join(", ") : "Every day"}</p>
              </div>
              <form action={toggleServiceActive.bind(null, s.id, !s.is_active)}>
                <button className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm text-ink/70">
                  {s.is_active ? "Turn off" : "Turn on"}
                </button>
              </form>
              <form action={deleteService.bind(null, s.id)}>
                <button className="rounded-lg px-2 py-1.5 text-sm text-chili">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
