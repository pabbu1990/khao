"use client";

import { useState } from "react";
import ShareLink from "@/components/ShareLink";

// Collapsible "Your ordering link" panel for the Orders page: a slim bar that
// expands to the full Copy / Share / QR card. Remembers open/closed state.
export default function ShareLinkPanel({ link }: { link: string }) {
  const [open, setOpen] = useState(false);
  const shortUrl = link.replace(/^https?:\/\//, "");

  function toggle() {
    setOpen((o) => !o);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-panel/40"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-spice/15 text-spice" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Your ordering link</span>
          <span className="block truncate text-xs text-ink/45">{shortUrl}</span>
        </span>
        <span className="hidden rounded-full bg-spice/15 px-2.5 py-0.5 text-xs font-semibold text-spice sm:inline">Share with customers</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-ink/40 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <p className="mb-3 max-w-2xl text-sm text-ink/55">
            Send this to your customers — drop it in your WhatsApp groups, status, or chats. They tap it to browse your menu and order, and every order lands right here.
          </p>
          <ShareLink link={link} />
        </div>
      )}
    </div>
  );
}
