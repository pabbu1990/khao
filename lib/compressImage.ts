// Client-side image compressor. Resizes large photos (e.g. 4 MB phone shots) down
// to a sensible web size before upload, so storage stays small and — more
// importantly — customer page loads don't burn through Supabase egress.
// Prefers WebP (keeps transparency, best compression); falls back to JPEG.

type Opts = { maxDim?: number; quality?: number };

export async function compressImage(file: File, opts: Opts = {}): Promise<File> {
  const maxDim = opts.maxDim ?? 1280;
  const quality = opts.quality ?? 0.8;

  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 300 * 1024) return file; // already small enough

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // undecodable (e.g. some HEIC) — let the original upload proceed
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close?.(); return file; }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));

  let blob = await toBlob("image/webp", quality);
  let ext = "webp";
  if (!blob) {
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    blob = await toBlob("image/jpeg", quality);
    ext = "jpg";
  }
  if (!blob || blob.size >= file.size) return file;

  const base = (file.name.replace(/\.[^.]+$/, "") || "image").replace(/[^a-zA-Z0-9_-]/g, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
