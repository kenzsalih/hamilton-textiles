import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Keeps the owner's Supabase session fresh on every admin request. */
async function refreshAdminSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // A reset link that fell back to the Site URL (e.g. redirect URL not allowed yet): finish it in the admin.
  if (!pathname.startsWith("/admin") && (searchParams.has("token_hash") || searchParams.has("code"))) {
    const target = new URL("/admin/login/callback", request.url);
    for (const k of ["token_hash", "type", "code"]) {
      const v = searchParams.get(k);
      if (v) target.searchParams.set(k, v);
    }
    return NextResponse.redirect(target);
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const response = refreshAdminSession(request);
    return response.then((r) => {
      r.headers.set("X-Robots-Tag", "noindex, nofollow");
      return r;
    });
  }
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
