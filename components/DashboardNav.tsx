"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PendingButton from "@/components/PendingButton";
import { signOut } from "@/app/actions";
import Logo from "@/components/Logo";

export default function DashboardNav({ openCount = 0 }: { openCount?: number }) {
  const pathname = usePathname() || "/dashboard";
  const [menuOpen, setMenuOpen] = useState(false);

  const active =
    pathname === "/dashboard" ? "orders"
    : pathname.startsWith("/dashboard/report") ? "report"
    : pathname.startsWith("/dashboard/menu") ? "menu"
    : pathname.startsWith("/dashboard/settings") ? "settings"
    : "orders";

  const TABS = [
    { key: "orders", href: "/dashboard", label: "Orders", badge: openCount },
    { key: "report", href: "/dashboard/report", label: "Report", badge: 0 },
    { key: "menu", href: "/dashboard/menu", label: "Menus", badge: 0 },
    { key: "settings", href: "/dashboard/settings", label: "Settings", badge: 0 },
  ];

  const badgeEl = (key: string, badge: number) =>
    badge > 0 ? <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold ${active === key ? "bg-ink/15 text-ink" : "bg-spice text-ink"}`}>{badge}</span> : null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 px-5 py-2.5 text-cream backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <span className="flex items-center gap-1.5"><Logo size={20} /><span className="font-display text-xl font-semibold tracking-tight text-spice">Khao</span></span>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 sm:flex">
          {TABS.map((t) => (
            <Link key={t.key} href={t.href} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active === t.key ? "bg-spice text-ink" : "text-cream/55 hover:bg-white/5 hover:text-cream"}`}>
              <span className="inline-flex items-center gap-1.5">{t.label}{badgeEl(t.key, t.badge)}</span>
            </Link>
          ))}
          <form action={signOut} className="ml-1">
            <PendingButton className="rounded-lg px-3 py-1.5 text-sm text-cream/55 transition hover:text-cream" pendingLabel="…">Sign out</PendingButton>
          </form>
        </nav>

        {/* Mobile: hamburger */}
        <button onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen} className="relative grid h-9 w-9 place-items-center rounded-lg text-cream/80 transition hover:bg-white/10 sm:hidden">
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          )}
          {!menuOpen && openCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-spice px-1 text-[10px] font-bold text-ink">{openCount}</span>}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 border-t border-white/10 pt-2 sm:hidden">
          {TABS.map((t) => (
            <Link key={t.key} href={t.href} onClick={() => setMenuOpen(false)} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active === t.key ? "bg-spice text-ink" : "text-cream/70 hover:bg-white/5"}`}>
              {t.label}{badgeEl(t.key, t.badge)}
            </Link>
          ))}
          <form action={signOut}>
            <PendingButton className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-cream/55 transition hover:bg-white/5" pendingLabel="Signing out…">Sign out</PendingButton>
          </form>
        </nav>
      )}
    </header>
  );
}
