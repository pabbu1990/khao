"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

export default function Reset() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");

  useEffect(() => {
    const supabase = createClient();
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    // Failed/expired link: Supabase (or our confirm route) signals it via an
    // error in the query string or URL hash. Show the expired message.
    if (search.get("error") || hash.get("error") || hash.get("error_code")) {
      setReady("invalid");
      return;
    }

    // Default-template flow: the link lands here with a one-time ?code= that we
    // exchange for a recovery session. (token_hash flow already set the session
    // in /auth/confirm, so there's no code and getSession finds it.)
    const code = search.get("code");
    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        setReady(error ? "invalid" : "ok");
        return;
      }
      const { data } = await supabase.auth.getSession();
      setReady(data.session ? "ok" : "invalid");
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    router.push("/post-login");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 text-cream">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-spice/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <span className="flex items-center gap-2"><Logo size={30} /><span className="font-display text-3xl font-bold tracking-tight text-spice">Khao</span></span>

        {ready === "invalid" ? (
          <>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">Link expired</h1>
            <p className="mt-1.5 text-sm text-cream/55">This password reset link is invalid or has expired. Request a new one from the sign-in page.</p>
            <Link href="/login" className="mt-6 inline-block rounded-xl bg-spice px-5 py-3 font-semibold text-ink transition hover:brightness-[1.04]">Back to sign in</Link>
          </>
        ) : (
          <>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight">Set a new password</h1>
            <p className="mt-1.5 text-sm text-cream/55">Choose a new password for your account.</p>
            <form onSubmit={submit} className="mt-7 space-y-3">
              <input type="password" required minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 focus:ring-spice/25" />
              <button disabled={loading || ready === "checking"} className="w-full rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
                {loading ? "Saving…" : "Update password"}
              </button>
            </form>
            {err && <p className="mt-4 text-sm text-chili">{err}</p>}
          </>
        )}
      </div>
    </main>
  );
}
