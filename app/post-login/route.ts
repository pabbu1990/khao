import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// After any sign-in, route the user by role: admin → /admin, everyone else → /dashboard.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const dest = profile?.role === "admin" ? "/admin" : "/dashboard";
  return NextResponse.redirect(`${origin}${dest}`);
}
