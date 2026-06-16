"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/format";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    router.push("/post-login");
    router.refresh();
  }

  async function google() {
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl()}/auth/callback?next=/post-login` },
    });
    if (error) setErr(error.message);
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 focus:ring-spice/25";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 text-cream">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-spice/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-chili/15 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <span className="font-display text-3xl font-bold tracking-tight text-spice">Khao</span>
        <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">
          {mode === "signup" ? "Create your kitchen account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-cream/55">
          {mode === "signup" ? "Set up your kitchen in a minute." : "Sign in to your kitchen dashboard."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          <input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          <button disabled={loading} className="w-full rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-cream/35">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <button onClick={google} className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 px-4 py-3 font-semibold text-cream transition hover:bg-white/5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-ink">G</span>
          Continue with Google
        </button>

        <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(null); }} className="mt-5 text-sm text-cream/60 transition hover:text-cream">
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        {err && <p className="mt-4 text-sm text-chili">{err}</p>}
      </div>
    </main>
  );
}
