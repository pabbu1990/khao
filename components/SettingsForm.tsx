"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { updateVendorSettings, requestProInterest } from "@/app/actions";
import type { Vendor } from "@/lib/types";

export default function SettingsForm({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cash, setCash] = useState(vendor.accept_cash);
  const [interac, setInterac] = useState(vendor.accept_interac);
  const [proInterest, setProInterest] = useState(!!vendor.pro_interest_at);
  const [proBusy, setProBusy] = useState(false);

  async function notifyPro() {
    setProBusy(true);
    const res = await requestProInterest();
    setProBusy(false);
    if (res?.ok) setProInterest(true);
  }

  useEffect(() => {
    if (msg?.ok) {
      const t = setTimeout(() => setMsg(null), 5000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await updateVendorSettings(new FormData(e.currentTarget));
    setBusy(false);
    if (res?.ok) {
      setMsg({ ok: true, text: res.note ? `Saved — ${res.note}` : "Settings saved." });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res?.error || "Couldn't save. Please try again." });
    }
  }

  const noPayment = !cash && !interac;

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-ink/45">Kitchen profile</h2>
        <div className="mt-3 space-y-3">
          <Labeled label="Kitchen name"><input name="name" defaultValue={vendor.name} className="inp" /></Labeled>

          <div>
            <span className="text-sm font-medium text-ink/70">Link name (your page address)</span>
            <div className="mt-1 flex items-center gap-1 rounded-lg border border-line bg-panel px-3 py-2.5 text-ink/60">
              <span className="text-ink/35">/</span>
              <span className="font-medium text-ink">{vendor.slug}</span>
            </div>
            <p className="mt-1 text-xs text-ink/45">Created automatically from your kitchen name and kept fixed, so links you&rsquo;ve already shared never break.</p>
          </div>

          <Labeled label="Bio" optional><textarea name="bio" defaultValue={vendor.bio ?? ""} placeholder="A short line about your kitchen" className="inp" /></Labeled>
          <Labeled label="Area" optional><input name="area" defaultValue={vendor.area ?? ""} placeholder="e.g. Barrhaven" className="inp" /></Labeled>
          <Labeled label="Hours" optional><input name="hours" defaultValue={vendor.hours ?? ""} placeholder="e.g. Mon–Fri, 11am–8pm" className="inp" /></Labeled>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-ink/45">Pickup location</h2>
          <span className="rounded-full bg-curry/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-curry">Recommended</span>
        </div>
        <p className="mt-1 text-sm text-ink/55">Add your pickup address so customers see exactly where to collect <strong className="text-ink/70">pickup</strong> orders on their confirmation page. Leave it blank and customers will be told you&rsquo;ll reach out with pickup instructions.</p>
        <div className="mt-3">
          <Labeled label="Pickup address">
            <textarea name="pickup_location" defaultValue={vendor.pickup_location ?? ""} placeholder="e.g. 123 Greenbank Rd, Barrhaven — ring unit 4, text when you arrive" className="inp" />
          </Labeled>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
        <h2 className="text-xs font-semibold uppercase tracking-[0.07em] text-ink/45">Payment methods</h2>
        <p className="mt-0.5 text-sm text-ink/55">Choose which options customers can pick at checkout. At least one stays on.</p>
        <div className="mt-3 space-y-2.5">
          <PayToggle
            name="accept_cash" checked={cash} onChange={setCash}
            title="Cash" desc="On pickup or delivery"
          />
          <PayToggle
            name="accept_interac" checked={interac} onChange={setInterac}
            title="Interac e-transfer" desc="Customers send to your email or phone"
          />
          <div className="rounded-xl border border-dashed border-ink/15 bg-panel/40 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-start gap-2.5">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink/65">Card payments</span>
                    <span className="rounded-full bg-spice/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#9a5a14]">Pro</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/45">Let customers pay by card at checkout — funds go straight to you via Stripe. Available with Khao Pro.</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-2">
                <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-ink/15 opacity-70">
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
                </span>
                {!proInterest && (
                  <button type="button" onClick={notifyPro} disabled={proBusy} className="rounded-lg border border-spice/50 px-3 py-1 text-xs font-semibold text-[#9a5a14] transition hover:bg-spice/10 disabled:opacity-60">
                    {proBusy ? "…" : "I’m interested"}
                  </button>
                )}
              </span>
            </div>
            {proInterest && (
              <div className="mt-2.5 flex items-start gap-2 border-t border-ink/10 pt-2.5 text-xs font-medium text-curry">
                <svg viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                <span>Your interest is captured — someone from Khao will reach out to you.</span>
              </div>
            )}
          </div>
        </div>
        {noPayment && (
          <p className="mt-3 rounded-lg bg-spice/10 px-3 py-2 text-sm text-ink/70">
            You need at least one payment method. If you leave both off, we&rsquo;ll keep <strong>Cash</strong> on when you save.
          </p>
        )}
        <div className="mt-3">
          <Labeled label="Interac e-transfer details (the email/phone customers send to)" optional>
            <textarea name="offline_instructions" defaultValue={vendor.offline_instructions ?? ""} placeholder="e.g. Send Interac e-transfer to payments@mykitchen.com" className="inp" />
          </Labeled>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-spice px-5 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
          {busy ? <span className="inline-flex items-center gap-2"><Spinner />Saving…</span> : "Save changes"}
        </button>
        {msg && (
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${msg.ok ? "text-curry" : "text-chili"}`}>
            {msg.ok && <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

function PayToggle({ name, checked, onChange, title, desc }: { name: string; checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${checked ? "border-curry/40 bg-curry/[0.05]" : "border-line hover:border-ink/25"}`}>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-ink/50">{desc}</span>
      </span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-curry" : "bg-ink/20"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </label>
  );
}

function Labeled({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-ink/40">(optional)</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
