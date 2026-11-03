"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Loader2, Minus, Plus } from "lucide-react";
import type { StockMovement } from "@/lib/data";
import { dateTime, metres } from "@/lib/admin/format";
import { adjustMaterialStock } from "@/app/admin/(console)/materials/actions";
import { Card, inputClass } from "./ui";

const REASON_LABEL: Record<string, string> = {
  order: "Online order",
  restock: "New stock",
  adjustment: "Correction",
  cancellation: "Order cancelled",
};

export function StockPanel({
  materialId,
  stock,
  lowAt,
  movements,
}: {
  materialId: string;
  stock: number;
  lowAt: number;
  movements: StockMovement[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "remove" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [pending, start] = useTransition();

  const n = Number(amount);
  const valid = amount !== "" && Number.isFinite(n) && n > 0 && (mode !== "remove" || n <= stock);

  const apply = () =>
    start(async () => {
      const res = await adjustMaterialStock(materialId, {
        change: mode === "remove" ? -n : n,
        reason: mode === "add" ? "restock" : "adjustment",
        note: note || undefined,
      });
      if (res.ok) {
        setMode(null);
        setAmount("");
        setNote("");
        router.refresh();
      }
    });

  const tone = stock === 0 ? "text-crimson" : stock <= lowAt ? "text-[#9a6a1f]" : "text-pine-800";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted">In stock</p>
          <p className={`font-display text-4xl ${tone}`}>{metres(stock)}</p>
          {stock <= lowAt && <p className={`text-xs font-medium ${tone}`}>{stock === 0 ? "Sold out — hidden from checkout" : `Below your alert level of ${metres(lowAt)}`}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode(mode === "remove" ? null : "remove")} className={`grid size-12 place-items-center rounded-full border ${mode === "remove" ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white"}`} aria-label="Remove stock">
            <Minus className="size-5" />
          </button>
          <button type="button" onClick={() => setMode(mode === "add" ? null : "add")} className={`grid size-12 place-items-center rounded-full border ${mode === "add" ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white"}`} aria-label="Add stock">
            <Plus className="size-5" />
          </button>
        </div>
      </div>

      {mode && (
        <div className="mt-4 space-y-3 rounded-xl bg-linen p-3.5">
          <p className="text-sm font-semibold">{mode === "add" ? "Add new stock" : "Remove stock (damaged, sold in shop, correction)"}</p>
          <div className="flex flex-wrap gap-2">
            {(mode === "add" ? [10, 25, 50, 100] : [0.5, 1, 2, 5]).map((q) => (
              <button key={q} type="button" onClick={() => setAmount(String(q))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${amount === String(q) ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white"}`}>
                {mode === "add" ? "+" : "−"}{q} m
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[7rem_1fr] gap-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Metres" aria-label="Metres" className={`${inputClass} mt-0`} />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" className={`${inputClass} mt-0`} />
          </div>
          {mode === "remove" && n > stock && <p className="text-xs text-crimson">Only {metres(stock)} in stock.</p>}
          <button type="button" disabled={!valid || pending} onClick={apply} className="btn btn-primary h-11 w-full disabled:opacity-50">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {valid ? `${mode === "add" ? "Add" : "Remove"} ${metres(n)} → ${metres(mode === "add" ? stock + n : stock - n)}` : "Enter metres"}
          </button>
        </div>
      )}

      {movements.length > 0 && (
        <div className="mt-4 border-t border-sand/70 pt-3">
          <button type="button" onClick={() => setShowHistory(!showHistory)} className="flex w-full items-center justify-between text-xs font-semibold text-ink-soft">
            Stock history
            <ChevronDown className={`size-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <ul className="mt-2 divide-y divide-sand/60 text-sm">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate">{REASON_LABEL[m.reason] ?? m.reason}{m.note ? ` — ${m.note}` : ""}</span>
                    <span className="text-[0.7rem] text-muted">{dateTime(m.created_at)}</span>
                  </span>
                  <span className={`shrink-0 font-semibold ${m.change_m > 0 ? "text-pine-700" : "text-crimson"}`}>
                    {m.change_m > 0 ? "+" : ""}{metres(m.change_m)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
