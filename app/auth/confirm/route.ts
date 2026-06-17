import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Verifies email links (password recovery, email confirmation) using token_hash.
// This is the robust flow: it doesn't depend on a PKCE code_verifier cookie, so
// it works even when the user opens the link on a different device/browser than
// the one that requested it (common for password resets).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/post-login";

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Invalid / expired / already-used link → send to reset, which shows a clear
  // "link expired, request a new one" message (it sees no session).
  const dest = type === "recovery" ? "/reset?error=expired" : "/login?error=link";
  return NextResponse.redirect(`${origin}${dest}`);
}
