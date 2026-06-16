import Link from "next/link";
import { signOut } from "@/app/actions";
import Logo from "@/components/Logo";

export default function DashboardNav({ active }: { active: "orders" | "items" | "report" | "menu" | "services" | "settings" }) {
  const tab = (key: string, href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active === key ? "bg-spice text-ink" : "text-cream/55 hover:bg-white/5 hover:text-cream"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/90 px-5 py-2.5 text-cream backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-3 flex items-center gap-1.5"><Logo size={20} /><span className="font-display text-xl font-semibold tracking-tight text-spice">Khao</span></span>
          {tab("orders", "/dashboard", "Orders")}
          {tab("report", "/dashboard/report", "Report")}
          {tab("menu", "/dashboard/menu", "Menu")}
          {tab("services", "/dashboard/services", "Services")}
          {tab("settings", "/dashboard/settings", "Settings")}
        </div>
        <form action={signOut}>
          <button className="rounded-lg px-3 py-1.5 text-sm text-cream/55 transition hover:text-cream">Sign out</button>
        </form>
      </div>
    </header>
  );
}
