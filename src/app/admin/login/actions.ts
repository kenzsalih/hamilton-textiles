"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_ADMIN_COOKIE, devSignInAllowed, getAuthClient, isAdminUser, isSupabaseAuthConfigured } from "@/lib/admin/session";

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (devSignInAllowed()) {
    (await cookies()).set(DEV_ADMIN_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    redirect("/admin");
  }

  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (!isSupabaseAuthConfigured()) {
    console.error("Admin sign-in: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing at runtime");
    return { error: "Sign-in isn't set up on this server yet (missing Supabase key)." };
  }

  const supabase = await getAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email or password is incorrect." };
  if (!(await isAdminUser(data.user.id))) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have access to the admin app." };
  }
  redirect("/admin");
}

export async function signOut() {
  if (devSignInAllowed()) {
    (await cookies()).delete(DEV_ADMIN_COOKIE);
  } else {
    await (await getAuthClient()).auth.signOut();
  }
  redirect("/admin/login");
}
