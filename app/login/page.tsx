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

  return (
    <main className="min-h-screen bg-ink text-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-spice font-semibold tracking-[0.3em] text-xs">KHAO</p>
        <h1 className="mt-3 font-display text-3xl font-bold">
          {mode === "signup" ? "Create your kitchen account" : "Vendor sign in"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white px-4 py-3 text-ink outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-white px-4 py-3 text-ink outline-none"
          />
          <button
            disabled={loading}
            className="w-full rounded-lg bg-spice px-4 py-3 font-semibold text-ink disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-cream/40 text-sm">
          <span className="h-px flex-1 bg-cream/15" /> or <span className="h-px flex-1 bg-cream/15" />
        </div>

        <button
          onClick={google}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-cream/30 px-4 py-3 font-semibold hover:bg-cream/10"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-ink text-xs font-bold">G</span>
          Continue with Google
        </button>

        <button
          onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(null); }}
          className="mt-4 text-sm text-cream/70 hover:text-cream"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        {err && <p className="mt-4 text-chili">{err}</p>}
      </div>
    </main>
  );
}
