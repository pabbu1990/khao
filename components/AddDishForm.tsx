"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addDish } from "@/app/actions";

const MAX_MB = 5;

export default function AddDishForm({ vendorId, services }: { vendorId: string; services: { id: string; name: string }[] }) {
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
      setMsg("Dish added.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-card sm:grid-cols-2">
      <select required value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2 bg-white">
        <option value="" disabled>Choose a service…</option>
        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input required placeholder="Dish name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2" />
      <input required type="number" step="0.01" min="0" placeholder="Price (CAD)" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2" />
      <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-ink/15 px-3 py-2 sm:col-span-2" />

      <div className="sm:col-span-2">
        <label className="flex items-center gap-3 rounded-lg border border-dashed border-ink/25 px-3 py-3 cursor-pointer hover:border-spice">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-md bg-panel text-ink/40 text-xl">📷</span>
          )}
          <span className="text-sm text-ink/60">
            {file ? file.name : "Upload a dish photo (optional)"}
          </span>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={veg} onChange={(e) => setVeg(e.target.checked)} /> Vegetarian
      </label>
      <button disabled={busy} className="rounded-lg bg-spice px-4 py-2 font-semibold text-ink disabled:opacity-60 sm:col-start-2">
        {busy ? "Saving…" : "Add dish"}
      </button>

      {err && <p className="text-chili text-sm sm:col-span-2">{err}</p>}
      {msg && <p className="text-sm font-medium text-curry sm:col-span-2">{msg}</p>}
    </form>
  );
}
