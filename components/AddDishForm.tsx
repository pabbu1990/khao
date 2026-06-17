"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addDish } from "@/app/actions";

const MAX_MB = 5;

export default function AddDishForm({ vendorId, services, onboarding = false }: { vendorId: string; services: { id: string; name: string }[]; onboarding?: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [veg, setVeg] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showFinish, setShowFinish] = useState(false);

  useEffect(() => {
    if (msg) {
      const t = setTimeout(() => setMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [msg]);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setErr(null);
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setErr(`Image must be under ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      let photoUrl = "";
      if (file) {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${vendorId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("dish-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) { setErr(`Upload failed: ${upErr.message}`); setBusy(false); return; }
        photoUrl = supabase.storage.from("dish-photos").getPublicUrl(path).data.publicUrl;
      }

      const fd = new FormData();
      fd.set("name", name);
      fd.set("price_cad", price);
      fd.set("description", description);
      if (serviceId) fd.set("service_id", serviceId);
      if (veg) fd.set("veg", "on");
      if (photoUrl) fd.set("photo_url", photoUrl);
      const res = await addDish(fd);
      if (!res.ok) { setErr(res.error || "Couldn't add the dish."); return; }
      setName(""); setPrice(""); setDescription(""); setVeg(false);
      setFile(null); setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setMsg("Dish added — add another below.");
      if (onboarding) setShowFinish(true); // first dish during setup: reveal the finish CTA
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    {showFinish && (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-curry/30 bg-curry/[0.06] px-5 py-3">
        <p className="text-sm font-medium text-ink/70">Add as many dishes as you like. When your menu&rsquo;s ready, head to your dashboard to share your link.</p>
        <Link href="/dashboard?done=ready" className="shrink-0 rounded-xl bg-curry px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105">Go to my dashboard →</Link>
      </div>
    )}
    <form onSubmit={submit} className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="font-display text-base font-bold text-ink">Add a dish</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.6fr_0.8fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Service</span>
          <select required value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5">
            <option value="" disabled>Choose a service…</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Dish name</span>
          <input required placeholder="e.g. Chicken Curry" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Price (CAD)</span>
          <input required type="number" step="0.01" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1.4fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Description</span>
          <input placeholder="Optional" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
        </label>
        <div className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Photo</span>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-ink/25 px-3 py-2 transition hover:border-spice">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-md bg-panel text-ink/40">📷</span>
            )}
            <span className="truncate text-sm text-ink/55">{file ? file.name : "Upload (optional)"}</span>
            <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
          </label>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-ink/70">
            <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} /> Veg
          </label>
          <button disabled={busy} className="rounded-xl bg-spice px-5 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
            {busy ? <span className="inline-flex items-center gap-2"><Spinner />Saving…</span> : "Add dish"}
          </button>
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-chili">{err}</p>}
      {msg && <p className="mt-3 text-sm font-medium text-curry">{msg}</p>}
    </form>
    </>
  );
}
