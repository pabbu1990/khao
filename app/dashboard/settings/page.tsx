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
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink/50">Manage your kitchen profile, ordering link, and payment options.</p>

        <Section title="Ordering link" desc="Share this with customers in WhatsApp — every order lands on your dashboard.">
          <ShareLink link={link} />
        </Section>

        <Section title="Kitchen logo" desc="Shows on your page, and on dishes that don't have their own photo.">
          <LogoUpload vendorId={vendor.id} current={vendor.logo_url} />
        </Section>

        <SettingsForm vendor={vendor} />
      </div>
      <style>{`.inp{width:100%;background:#fff;border:1px solid rgba(42,24,16,.15);border-radius:.625rem;padding:.6rem .8rem;font-size:.95rem;color:#2A1810;transition:border-color .15s,box-shadow .15s}.inp:hover{border-color:rgba(42,24,16,.28)}.inp:focus{outline:none;border-color:#E0922F;box-shadow:0 0 0 3px rgba(224,146,47,.18)}.inp::placeholder{color:rgba(42,24,16,.38)}`}</style>
    </main>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-card">
      <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-ink/45">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-ink/55">{desc}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
