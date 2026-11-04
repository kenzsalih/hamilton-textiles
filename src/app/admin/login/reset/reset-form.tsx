"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { setNewPassword, type NewPasswordState } from "../actions";
import { authInputClass } from "../auth-card";

export function ResetForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(setNewPassword, { error: null });

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">New password</span>
        <input name="password" type="password" autoComplete="new-password" minLength={10} required className={authInputClass} />
        <span className="mt-1 block text-xs text-muted">At least 10 characters.</span>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">Type it again</span>
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className={authInputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-crimson/10 px-4 py-3 text-sm text-crimson">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save and sign in
      </button>
    </form>
  );
}
