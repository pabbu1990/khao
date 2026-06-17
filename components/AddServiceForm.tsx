"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { addService } from "@/app/actions";
import MultiDateField from "@/components/MultiDateField";

export default function AddServiceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

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
      setMsg({ ok: true, text: "Service added." });
      setFormKey((k) => k + 1); // remount to clear fields + date chips
      router.refresh();
    } else {
      setMsg({ ok: false, text: res?.error || "Couldn't add the service. Please try again." });
    }
  }

  return (
    <form key={formKey} onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-card">
      <input name="name" required placeholder="Service name (e.g. Weekday Lunch)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
      <input name="description" placeholder="Short description (optional)" className="w-full rounded-lg border border-ink/15 px-3 py-2" />
      <MultiDateField />
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
          {busy ? <span className="inline-flex items-center gap-2"><Spinner />Adding…</span> : "Add service"}
        </button>
        {msg && <span className={`text-sm font-medium ${msg.ok ? "text-curry" : "text-chili"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}
