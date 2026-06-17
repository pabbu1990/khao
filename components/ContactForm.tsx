"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { sendContactMessage } from "@/app/actions";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);
    const res = await sendContactMessage(form);
    if (res.ok) {
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", reason: "" });
    } else {
      setStatus("error");
      setErr(res.error || "Something went wrong.");
    }
  }

  const input = "w-full rounded-xl border border-white/10 bg-white/95 px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 focus:ring-spice/25";

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-curry/15 px-4 py-6 text-center">
        <p className="font-semibold text-cream">Thanks — your message is on its way.</p>
        <p className="mt-1 text-sm text-cream/60">We&rsquo;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={input} required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={input} required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className={input} placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <textarea className={input} required rows={4} placeholder="How can we help?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <button disabled={status === "sending"} className="w-full rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
        {status === "sending" ? <span className="inline-flex items-center gap-2"><Spinner />Sending…</span> : "Send message"}
      </button>
      {err && <p className="text-sm text-chili">{err}</p>}
    </form>
  );
}
