import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getAuthClient } from "@/lib/admin/session";

// Supabase sends the owner here from the reset email. Verifying the link signs
// them in (cookies), then they choose a new password.
// - token_hash: from our email template; works on any device or browser.
// - code: Supabase's default link; only works in the browser that asked for it.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "recovery") as EmailOtpType;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin/login/reset";
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  if (tokenHash || code) {
    const supabase = await getAuthClient();
    const { error } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : await supabase.auth.exchangeCodeForSession(code!);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.error("Reset link failed:", error.message);
  }
  return NextResponse.redirect(new URL("/admin/login?reset=expired", url.origin));
}
