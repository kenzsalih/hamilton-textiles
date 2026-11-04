"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { requestPasswordReset, type ResetRequestState } from "../actions";
import { authInputClass } from "../auth-card";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(requestPasswordReset, { sent: false, error: null });

  if (state.sent) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-pine-700" strokeWidth={1.5} />
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          If that email has an admin account, a reset link is on its way. The link works once, for one hour.
        </p>
        <p className="mt-3 text-xs text-muted">Nothing after a few minutes? Check your spam folder.</p>
        <Link href="/admin/login" className="btn btn-ghost mt-6 w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Email</span>
        <input name="email" type="email" autoComplete="username" required className={authInputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-crimson/10 px-4 py-3 text-sm text-crimson">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send reset link
      </button>
      <Link href="/admin/login" className="block text-center text-xs font-semibold text-pine-700 hover:text-pine-900">
        Back to sign in
      </Link>
    </form>
  );
}
