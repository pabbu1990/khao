import Link from "next/link";
import { signOut } from "@/app/actions";

export default function DashboardNav({ active }: { active: "orders" | "services" | "menu" | "settings" }) {
  const tab = (key: string, href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${active === key ? "bg-spice text-ink" : "text-cream/70 hover:text-cream"}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-spice mr-2">KHAO</span>
        {tab("orders", "/dashboard", "Orders")}
        {tab("services", "/dashboard/services", "Services")}
        {tab("menu", "/dashboard/menu", "Menu")}
        {tab("settings", "/dashboard/settings", "Settings")}
      </div>
      <form action={signOut}>
        <button className="text-sm text-cream/60 hover:text-cream">Sign out</button>
      </form>
    </header>
  );
}
