"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setVendorLogo } from "@/app/actions";

export default function LogoUpload({ vendorId, current }: { vendorId: string; current: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErr("Image must be under 5 MB."); return; }
    setBusy(true); setErr(null);
    const supabase = createClient();
    const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${vendorId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("dish-photos").upload(path, f, { upsert: false });
    if (error) { setErr(error.message); setBusy(false); return; }
    const pub = supabase.storage.from("dish-photos").getPublicUrl(path).data.publicUrl;
    await setVendorLogo(pub);
    setUrl(pub); setBusy(false); router.refresh();
  }

  async function remove() {
    setBusy(true);
    await setVendorLogo("");
    setUrl(null); setBusy(false); router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-line" />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-xl bg-panel text-xs text-ink/40">No logo</span>
      )}
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-line px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/25">
          {busy ? "Uploading…" : url ? "Replace" : "Upload logo"}
          <input type="file" accept="image/*" onChange={pick} className="hidden" />
        </label>
        {url && <button onClick={remove} disabled={busy} className="text-sm font-semibold text-chili disabled:opacity-60">{busy ? "Removing…" : "Remove"}</button>}
      </div>
      {err && <p className="text-sm text-chili">{err}</p>}
    </div>
  );
}
