"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteMaterial } from "@/app/admin/(console)/materials/actions";
import { Card } from "./ui";

export function DangerZone({ materialId, name }: { materialId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  return (
    <Card className="mb-24 border-crimson/20 p-4 sm:p-5 lg:mb-0">
      <h2 className="text-sm font-semibold text-crimson">Delete fabric</h2>
      <p className="mt-1 text-xs text-muted">
        Removes it from the website and the admin app. Past orders keep their details. To take it off sale for a while, turn off
        &ldquo;Show on website&rdquo; instead.
      </p>
      {confirming ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost h-11 flex-1">
            Keep it
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await deleteMaterial(materialId);
                router.replace("/admin/materials");
              })
            }
            className="btn h-11 flex-1 bg-crimson text-white hover:bg-crimson/90"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete {name}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-crimson">
          <Trash2 className="size-4" />
          Delete this fabric
        </button>
      )}
    </Card>
  );
}
