"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type LoginState } from "./actions";
import { authInputClass } from "./auth-card";

export function LoginForm({ dev }: { dev: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: null });

  if (dev) {
    return (
      <form action={action} className="text-center">
        <p className="text-sm leading-relaxed text-ink-soft">
          <span className="font-semibold text-ink">Development mode.</span> Supabase isn&apos;t connected yet, so sign-in is
          open on this computer only and uses the local test data.
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enter admin
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={authInputClass}
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={authInputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-crimson/10 px-4 py-3 text-sm text-crimson">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </button>
      <Link href="/admin/login/forgot" className="block text-center text-xs font-semibold text-pine-700 hover:text-pine-900">
        Forgot password?
      </Link>
    </form>
  );
}
