import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ShareLink from "@/components/ShareLink";
import LogoUpload from "@/components/LogoUpload";
import SettingsForm from "@/components/SettingsForm";
import { siteUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: vendor } = await supabase.from("vendors").select("*").eq("owner_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!vendor) redirect("/dashboard");

  const link = `${siteUrl()}/${vendor.slug}`;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>

        <div className="mt-3 rounded-xl bg-white p-4 shadow-card">
          <p className="mb-2 text-sm text-ink/60">Your ordering link — share this in WhatsApp</p>
          <ShareLink link={link} />
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold text-ink/70">Kitchen logo</p>
          <LogoUpload vendorId={vendor.id} current={vendor.logo_url} />
        </div>

        <SettingsForm vendor={vendor} />
      </div>
      <style>{`.inp{width:100%;border:1px solid rgba(42,24,16,.15);border-radius:.5rem;padding:.5rem .75rem}`}</style>
    </main>
  );
}
