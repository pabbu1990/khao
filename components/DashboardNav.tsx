"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PendingButton from "@/components/PendingButton";
import { signOut } from "@/app/actions";
import Logo from "@/components/Logo";

export default function DashboardNav({ openCount = 0 }: { openCount?: number }) {
  const pathname = usePathname() || "/dashboard";
  const active =
    pathname === "/dashboard" ? "orders"
    : pathname.startsWith("/dashboard/report") ? "report"
    : pathname.startsWith("/dashboard/menu") ? "menu"
    : pathname.startsWith("/dashboard/settings") ? "settings"
    : "orders";

  const tab = (key: string, href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active === key ? "bg-spice text-ink" : "text-cream/55 hover:bg-white/5 hover:text-cream"}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {badge && badge > 0 ? (
          <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold ${active === key ? "bg-ink/15 text-ink" : "bg-spice text-ink"}`}>{badge}</span>
        ) : null}
      </span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 px-5 py-2.5 text-cream backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-3 flex items-center gap-1.5"><Logo size={20} /><span className="font-display text-xl font-semibold tracking-tight text-spice">Khao</span></span>
          {tab("orders", "/dashboard", "Orders", openCount)}
          {tab("report", "/dashboard/report", "Report")}
          {tab("menu", "/dashboard/menu", "Menus")}
          {tab("settings", "/dashboard/settings", "Settings")}
        </div>
        <form action={signOut}>
          <PendingButton className="rounded-lg px-3 py-1.5 text-sm text-cream/55 transition hover:text-cream" pendingLabel="…">Sign out</PendingButton>
        </form>
      </div>
    </header>
  );
}
