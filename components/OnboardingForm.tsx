"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/app/actions";
import Logo from "@/components/Logo";

export default function OnboardingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await createVendor(new FormData(e.currentTarget));
    setBusy(false);
    if (res?.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setErr(res?.error || "Couldn't create your kitchen. Please try again.");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-clip bg-ink px-6 text-cream">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-spice/20 blur-3xl" />
      <form onSubmit={submit} className="relative w-full max-w-md space-y-3">
        <span className="flex items-center gap-2"><Logo size={26} /><span className="font-display text-2xl font-bold tracking-tight text-spice">Khao</span></span>
        <h1 className="font-display text-3xl font-bold">Set up your kitchen</h1>
        <p className="text-sm leading-relaxed text-cream/70">This creates your public ordering page. Your link is made from your kitchen name — you can change it, your hours and payment details later in Settings.</p>
        <input name="name" required placeholder="Kitchen name (e.g. Spice Divine)" className="w-full rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 focus:ring-spice/25" />
        <input name="area" placeholder="Area (e.g. Barrhaven)" className="w-full rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 focus:ring-spice/25" />
        <button disabled={busy} className="w-full rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
          {busy ? "Creating…" : "Create my kitchen"}
        </button>
        {err && <p className="text-sm text-chili">{err}</p>}
      </form>
    </main>
  );
}
