import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { updateVendorSettings } from "@/app/actions";
import { siteUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const link = `${siteUrl()}/${vendor.slug}`;

  return (
    <main className="min-h-screen bg-cream">
      <DashboardNav active="settings" />
      <div className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>

        <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-ink/60">Your ordering link — share this in WhatsApp</p>
          <p className="font-semibold text-spice break-all">{link}</p>
        </div>

        <form action={updateVendorSettings} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <Labeled label="Kitchen name"><input name="name" defaultValue={vendor.name} className="inp" /></Labeled>
          <Labeled label="Link name (your page address)"><input name="slug" defaultValue={vendor.slug} className="inp" /></Labeled>
          <Labeled label="Bio"><textarea name="bio" defaultValue={vendor.bio ?? ""} className="inp" /></Labeled>
          <Labeled label="Area"><input name="area" defaultValue={vendor.area ?? ""} className="inp" /></Labeled>
          <Labeled label="Hours"><input name="hours" defaultValue={vendor.hours ?? ""} className="inp" /></Labeled>

          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="accepting_orders" defaultChecked={vendor.accepting_orders} /> Currently accepting orders
          </label>

          <hr className="border-ink/10" />
          <p className="text-sm font-semibold text-ink">Payment methods</p>
          <p className="text-sm text-ink/60">Choose which options customers can pick at checkout. At least one stays on.</p>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="accept_cash" defaultChecked={vendor.accept_cash} /> Accept cash (on pickup / delivery)
          </label>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="accept_interac" defaultChecked={vendor.accept_interac} /> Accept Interac e-transfer
          </label>
          <Labeled label="Interac e-transfer details (the email/phone customers send to)">
            <textarea name="offline_instructions" defaultValue={vendor.offline_instructions ?? ""} placeholder="e.g. Send Interac e-transfer to payments@mykitchen.com" className="inp" />
          </Labeled>

          <button className="rounded-lg bg-spice px-5 py-2.5 font-semibold text-ink">Save</button>
        </form>
      </div>
      <style>{`.inp{width:100%;border:1px solid rgba(42,24,16,.15);border-radius:.5rem;padding:.5rem .75rem}`}</style>
    </main>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
