"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const LINKS: [string, string][] = [["#features", "Features"], ["#pricing", "Pricing"], ["#faq", "FAQ"], ["#contact", "Contact"]];

export default function HomeNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-ink">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-display text-2xl font-bold tracking-tight text-spice">Khao</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-cream/70 sm:flex">
          {LINKS.map(([h, l]) => <a key={h} href={h} className="transition hover:text-cream">{l}</a>)}
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-cream/80 transition hover:border-white/35 hover:bg-white/5 hover:text-cream">Vendor login</Link>
          <Link href="/login?mode=signup" className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-[1.04]">Get started</Link>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-cream sm:hidden" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-3 text-cream/80">
            {LINKS.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="transition hover:text-cream">{l}</a>)}
            <Link href="/login" onClick={() => setOpen(false)} className="transition hover:text-cream">Vendor login</Link>
            <Link href="/login?mode=signup" onClick={() => setOpen(false)} className="rounded-lg bg-spice px-4 py-2 text-center font-semibold text-ink">Get started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
