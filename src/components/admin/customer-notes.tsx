"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveCustomerNotes } from "@/app/admin/(console)/orders/actions";
import { Card } from "./ui";

export function CustomerNotes({ customerId, initial }: { customerId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = value !== saved;

  return (
    <Card className="p-4 sm:p-5">
      <label htmlFor="customer-notes" className="text-sm font-semibold">
        Private notes
      </label>
      <p className="text-[0.7rem] text-muted">Only you can see these — sizes, preferences, reminders.</p>
      <textarea
        id="customer-notes"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="e.g. Prefers black crepe, makes abayas for her daughters"
        className="mt-2 w-full rounded-xl border border-sand bg-white px-3.5 py-3 text-base outline-none focus:border-pine-500 sm:text-sm"
      />
      <button
        type="button"
        disabled={!dirty || pending}
        onClick={() =>
          start(async () => {
            await saveCustomerNotes(customerId, value);
            setSaved(value);
          })
        }
        className="btn btn-ghost mt-2 h-10 px-4 text-xs disabled:opacity-40"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : !dirty && saved ? <Check className="size-3.5" /> : null}
        {dirty ? "Save notes" : "Saved"}
      </button>
    </Card>
  );
}
