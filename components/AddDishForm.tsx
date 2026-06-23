"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compressImage";
import { addDish } from "@/app/actions";

const MAX_MB = 25;

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

  function removePhoto() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!(Number(price) > 0)) { setErr("Enter a price greater than $0."); return; }
    setBusy(true);
    try {
      let photoUrl = "";
      if (file) {
        const supabase = createClient();
        const out = await compressImage(file, { maxDim: 1280, quality: 0.8 });
        const ext = (out.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${vendorId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("dish-photos").upload(path, out, { cacheControl: "2592000", upsert: false });
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
      removePhoto();
      setMsg("Dish added — add another below.");
      if (onboarding) setShowFinish(true);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-ink">Add a dish</h2>
          <label className="flex items-center gap-2 text-sm text-ink/45">
            to
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink">
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <div className="relative min-h-[150px] sm:w-[150px] sm:flex-none">
            <label className="flex h-full min-h-[150px] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border border-dashed border-ink/25 bg-cream/50 text-center transition hover:border-spice">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-spice/70" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  <span className="text-xs font-semibold text-spice/80">Add photo</span>
                  <span className="text-[11px] text-ink/35">optional</span>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
            </label>
            {preview && (
              <button type="button" onClick={removePhoto} aria-label="Remove photo" className="absolute right-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-ink/60 text-xs text-white transition hover:bg-ink/80">✕</button>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Dish name</span>
                <input required placeholder="e.g. Chicken Curry" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Price (CAD)</span>
                <input required type="number" step="any" min="0" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
              </label>
            </div>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Description</span>
              <input placeholder="Optional — a short line about the dish" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-ink/15 px-3 py-2.5" />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
          <button type="button" onClick={() => setVeg((v) => !v)} role="switch" aria-checked={veg} className="inline-flex items-center gap-2.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink/70 transition hover:border-ink/25">
            Vegetarian
            <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${veg ? "bg-curry" : "bg-ink/25"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${veg ? "left-[0.875rem]" : "left-0.5"}`} />
            </span>
          </button>
          <button disabled={busy} className="rounded-xl bg-spice px-6 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
            {busy ? <span className="inline-flex items-center gap-2"><Spinner />Saving…</span> : "Add dish"}
          </button>
        </div>

        {err && <p className="mt-3 text-sm text-chili">{err}</p>}
        {msg && <p className="mt-3 text-sm font-medium text-curry">{msg}</p>}
      </form>
    </>
  );
}
