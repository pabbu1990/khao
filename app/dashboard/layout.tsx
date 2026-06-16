import { createClient } from "@/lib/supabase/server";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export const dynamic = "force-dynamic";

// Mounts the new-order alert (chime + toast) across every dashboard tab,
// so vendors are notified even when they're on Report / Menu / Services / Settings.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let vendorId: string | null = null;
  if (user) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    vendorId = vendor?.id ?? null;
  }

  return (
    <>
      {vendorId && <RealtimeRefresher vendorId={vendorId} />}
      {children}
    </>
  );
}
