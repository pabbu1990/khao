import { createClient } from "@/lib/supabase/server";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import DashboardNav from "@/components/DashboardNav";

export const dynamic = "force-dynamic";

// Mounts the dashboard nav (with a live open-order badge) and the new-order alert
// across every dashboard tab, so vendors are notified and oriented everywhere.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let vendorId: string | null = null;
  let openCount = 0;
  if (user) {
    const { data: vendor } = await supabase
      .from("vendors").select("id").eq("owner_id", user.id)
      .order("created_at", { ascending: true }).limit(1).maybeSingle();
    vendorId = vendor?.id ?? null;
    if (vendorId) {
      const { count } = await supabase
        .from("orders").select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId).in("status", ["placed", "accepted", "ready"]);
      openCount = count ?? 0;
    }
  }

  return (
    <>
      <DashboardNav openCount={openCount} />
      {vendorId && <RealtimeRefresher vendorId={vendorId} />}
      {children}
    </>
  );
}
