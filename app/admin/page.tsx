import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/actions";
import type { Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") {
    // Not an admin — bounce to the vendor dashboard. (Data is also protected by RLS.)
    redirect("/dashboard");
  }

  const { data: vendors } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
  const { data: orders } = await supabase.from("orders").select("vendor_id,status,subtotal_cad");

  const tally = new Map<string, { count: number; revenue: number }>();
  for (const o of orders ?? []) {
    const t = tally.get(o.vendor_id) || { count: 0, revenue: 0 };
    t.count += 1;
    if (o.status === "completed") t.revenue += Number(o.subtotal_cad);
    tally.set(o.vendor_id, t);
  }

  const list = (vendors ?? []) as Vendor[];

  return (
    <main className="min-h-screen bg-cream">
      <header className="bg-ink text-cream px-5 py-3 flex items-center justify-between">
        <span className="font-display font-bold text-spice">KHAO · Admin</span>
        <form action={signOut}><button className="text-sm text-cream/60">Sign out</button></form>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="flex gap-3">
          <Box label="Kitchens" value={String(list.length)} />
          <Box label="Active" value={String(list.filter((v) => v.status === "active").length)} />
          <Box label="Total orders" value={String((orders ?? []).length)} />
        </div>

        <h1 className="mt-6 mb-2 font-semibold text-ink">All kitchens</h1>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-panel text-ink/60">
              <tr><th className="text-left p-3">Kitchen</th><th className="text-left p-3">Status</th><th className="text-right p-3">Orders</th><th className="text-right p-3">Revenue</th><th></th></tr>
            </thead>
            <tbody>
              {list.map((v) => {
                const t = tally.get(v.id) || { count: 0, revenue: 0 };
                return (
                  <tr key={v.id} className="border-t border-ink/5">
                    <td className="p-3">
                      <p className="font-semibold text-ink">{v.name}</p>
                      <p className="text-ink/40">/{v.slug}</p>
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${v.status === "active" ? "bg-curry/15 text-curry" : "bg-chili/15 text-chili"}`}>{v.status}</span>
                    </td>
                    <td className="p-3 text-right text-ink">{t.count}</td>
                    <td className="p-3 text-right text-ink">${t.revenue.toFixed(2)}</td>
                    <td className="p-3 text-right"><Link href={`/admin/vendor/${v.id}`} className="text-spice font-semibold">View</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-white p-4 shadow-sm text-center">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
