"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/site";
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

export type ResetRequestState = { sent: boolean; error: string | null };

/** Emails a reset link. Supabase itself doesn't reveal whether the email exists. */
export async function requestPasswordReset(_prev: ResetRequestState, form: FormData): Promise<ResetRequestState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { sent: false, error: "Enter your email." };
  if (!isSupabaseAuthConfigured()) return { sent: false, error: "Sign-in isn't set up on this server yet." };

  const supabase = await getAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/admin/login/callback?next=/admin/login/reset`,
  });
  if (error) {
    console.error("Password reset email failed:", error.message);
    return {
      sent: false,
      error: error.status === 429 ? "Too many reset emails. Please wait an hour and try again." : "Couldn't send the email. Please try again in a minute.",
    };
  }
  return { sent: true, error: null };
}

export type NewPasswordState = { error: string | null };

export async function setNewPassword(_prev: NewPasswordState, form: FormData): Promise<NewPasswordState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await getAuthClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.code === "same_password" ? "Choose a password you haven't used before." : "Couldn't save the new password. Please try again." };
  }
  if (!(await isAdminUser(data.user.id))) {
    await supabase.auth.signOut();
    return { error: "Password saved, but this account doesn't have access to the admin app." };
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
