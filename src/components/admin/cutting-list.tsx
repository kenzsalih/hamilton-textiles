"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { OrderItem } from "@/lib/data";
import { bhd, metres } from "@/lib/admin/format";

/**
 * Items to cut, with tick-boxes so the owner can work through an order at the
 * cutting table. Ticks are remembered on this device only.
 */
export function CuttingList({ orderId, items, canTick }: { orderId: string; items: OrderItem[]; canTick: boolean }) {
  const key = `ht_cut_${orderId}`;
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) ?? "[]"));
    } catch {
      setDone([]);
    }
  }, [key]);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Ticks are a convenience only.
    }
  };

  return (
    <ul className="divide-y divide-sand/70">
      {items.map((item) => {
        const ticked = done.includes(item.id);
        return (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            {canTick && (
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={ticked}
                aria-label={`Mark ${item.name_en} as cut`}
                className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors ${ticked ? "border-pine-700 bg-pine-700 text-ivory" : "border-stone"}`}
              >
                <Check className={`size-4 ${ticked ? "" : "invisible"}`} strokeWidth={3} />
              </button>
            )}
            <div className={`min-w-0 flex-1 ${ticked ? "opacity-50" : ""}`}>
              {item.material_id ? (
                <Link href={`/admin/materials/${item.material_id}`} className={`block truncate text-sm font-semibold hover:underline ${ticked ? "line-through" : ""}`}>
                  {item.name_en}
                </Link>
              ) : (
                <p className="truncate text-sm font-semibold">{item.name_en}</p>
              )}
              <p className="text-xs text-muted">
                {item.sku} · {bhd(item.price_fils)}/m
              </p>
            </div>
            <div className="shrink-0 text-end">
              <p className="font-display text-2xl leading-none text-pine-900">{metres(item.metres)}</p>
              <p className="text-xs text-muted">{bhd(item.line_total_fils)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
