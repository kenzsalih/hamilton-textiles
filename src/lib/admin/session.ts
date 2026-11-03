import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const DEV_ADMIN_COOKIE = "ht_admin_dev";

export type AdminSession = { kind: "owner"; email: string } | { kind: "dev"; email: string };

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Dev sign-in is only offered locally, before Supabase is connected. */
export function devSignInAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && !isSupabaseAuthConfigured();
}

/** Supabase client bound to the request cookies (owner's auth session). */
export async function getAuthClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component — the proxy refreshes the session instead.
        }
      },
    },
  });
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const db = getAdminSupabase();
  if (!db) return false;
  const { data } = await db.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (devSignInAllowed()) {
    return (await cookies()).get(DEV_ADMIN_COOKIE)?.value === "1" ? { kind: "dev", email: "owner@dev.local" } : null;
  }
  if (!isSupabaseAuthConfigured()) return null;

  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isAdminUser(data.user.id))) return null;
  return { kind: "owner", email: data.user.email ?? "" };
}

/** Guards every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
