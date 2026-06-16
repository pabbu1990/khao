"use client";

import { useState } from "react";

export default function ShareLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent("Order from our kitchen here: " + link)}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-[10rem] flex-1 truncate rounded-lg bg-panel px-3 py-2 text-sm text-ink">{link}</code>
        <button onClick={copy} className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-cream transition hover:opacity-90">
          {copied ? "Copied!" : "Copy"}
        </button>
        <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-curry px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-105">
          Share on WhatsApp
        </a>
        <button onClick={() => setShowQr((v) => !v)} className="rounded-lg border border-line px-3.5 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/25">
          {showQr ? "Hide QR" : "QR code"}
        </button>
      </div>
      {showQr && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR code for your ordering link" className="mt-3 h-40 w-40 rounded-lg bg-white p-2 ring-1 ring-line" />
      )}
    </div>
  );
}
