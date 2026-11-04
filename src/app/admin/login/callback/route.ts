import { NextResponse, type NextRequest } from "next/server";
import { getAuthClient } from "@/lib/admin/session";

// Supabase sends the owner here from the reset email with a one-time code.
// Exchanging it signs them in (cookies), then they choose a new password.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  if (code) {
    const supabase = await getAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.error("Reset link exchange failed:", error.message);
  }
  return NextResponse.redirect(new URL("/admin/login?reset=expired", url.origin));
}
