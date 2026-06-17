"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { addService } from "@/app/actions";
import MultiDateField from "@/components/MultiDateField";

export default function AddServiceForm({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    if (msg?.ok) {
      const t = setTimeout(() => setMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await addService(new FormData(e.currentTarget));
    setBusy(false);
    if (res?.ok) {
      setName("");
      setFormKey((k) => k + 1); // remount to clear fields + date chips
      if (onAdded) onAdded(); else setMsg({ ok: true, text: "Menu added." });
      router.refresh();
    } else {
      setMsg({ ok: false, text: res?.error || "Couldn't add the menu. Please try again." });
    }
  }

  return (
    <form key={formKey} onSubmit={submit} className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-bold text-ink">Add a menu</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Weekday Lunch", "Weekend Specials", "Tiffin", "Evening Snacks"].map((c) => (
          <button type="button" key={c} onClick={() => setName(c)}
            className="rounded-full border border-spice/30 bg-spice/10 px-3 py-1 text-xs font-semibold text-spice transition hover:bg-spice/20">
            {c}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Name</span>
          <input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekday Lunch" className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Description</span>
          <input name="description" placeholder="Optional" className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
        </label>
      </div>
      <div className="mt-3">
        <MultiDateField />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button disabled={busy} className="rounded-xl bg-spice px-5 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
          {busy ? <span className="inline-flex items-center gap-2"><Spinner />Adding…</span> : "Add menu"}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? "text-curry" : "text-chili"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
