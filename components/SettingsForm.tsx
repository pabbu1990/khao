"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateVendorSettings } from "@/app/actions";
import type { Vendor } from "@/lib/types";

export default function SettingsForm({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cash, setCash] = useState(vendor.accept_cash);
  const [interac, setInterac] = useState(vendor.accept_interac);

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
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-card">
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

      <hr className="border-ink/10" />
      <p className="text-sm font-semibold text-ink">Payment methods</p>
      <p className="text-sm text-ink/60">Choose which options customers can pick at checkout. At least one stays on.</p>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="accept_cash" checked={cash} onChange={(e) => setCash(e.target.checked)} /> Accept cash (on pickup / delivery)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="accept_interac" checked={interac} onChange={(e) => setInterac(e.target.checked)} /> Accept Interac e-transfer
      </label>
      {noPayment && (
        <p className="rounded-lg bg-spice/10 px-3 py-2 text-sm text-ink/70">
          You need at least one payment method. If you leave both off, we&rsquo;ll keep <strong>Cash</strong> on when you save.
        </p>
      )}
      <Labeled label="Interac e-transfer details (the email/phone customers send to)" optional>
        <textarea name="offline_instructions" defaultValue={vendor.offline_instructions ?? ""} placeholder="e.g. Send Interac e-transfer to payments@mykitchen.com" className="inp" />
      </Labeled>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button disabled={busy} className="rounded-lg bg-spice px-5 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? "text-curry" : "text-chili"}`}>{msg.text}</span>}
      </div>
    </form>
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
