"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Loader2, Plus, Share2, Trash2, X } from "lucide-react";
import type { PromoCode } from "@/lib/data";
import { bhd, date } from "@/lib/admin/format";
import { deletePromo, savePromo, type PromoFormValues } from "@/app/admin/(console)/promos/actions";
import { Empty, Field, inputClass } from "./ui";

function state(p: PromoCode): { label: string; tone: string } {
  const now = Date.now();
  if (!p.is_active) return { label: "Paused", tone: "bg-stone/20 text-ink-soft" };
  if (p.expires_at && Date.parse(p.expires_at) < now) return { label: "Expired", tone: "bg-crimson/10 text-crimson" };
  if (p.max_uses !== null && p.used_count >= p.max_uses) return { label: "Used up", tone: "bg-crimson/10 text-crimson" };
  if (p.starts_at && Date.parse(p.starts_at) > now) return { label: "Scheduled", tone: "bg-[#dfe8f3] text-[#2c4a72]" };
  return { label: "Active", tone: "bg-pine-100 text-pine-800" };
}

const describe = (p: PromoCode) => (p.kind === "percent" ? `${p.value}% off` : `${bhd(p.value)} off`);
const toDay = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bahrain" }).format(new Date(iso)) : "");

export function PromoManager({ promos }: { promos: PromoCode[] }) {
  const [editing, setEditing] = useState<PromoCode | "new" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const share = async (p: PromoCode) => {
    const text = `Use code ${p.code} for ${describe(p)} at Hamilton Textiles${p.min_order_fils ? ` on orders over ${bhd(p.min_order_fils)}` : ""}.`;
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(p.id);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  return (
    <div>
      <button type="button" onClick={() => setEditing("new")} className="btn btn-primary h-11 w-full sm:w-auto">
        <Plus className="size-4" />
        New promo code
      </button>

      {promos.length === 0 ? (
        <div className="mt-5">
          <Empty title="No promo codes yet" body="Create one for Eid, a new collection or your regulars." />
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {promos.map((p) => {
            const s = state(p);
            return (
              <li key={p.id} className="rounded-[1.25rem] border border-sand/80 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setEditing(p)} className="text-start">
                    <p className="font-mono text-lg font-bold tracking-wider text-pine-900">{p.code}</p>
                    <p className="text-sm text-ink-soft">
                      {describe(p)}
                      {p.min_order_fils > 0 && ` · over ${bhd(p.min_order_fils)}`}
                    </p>
                  </button>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${s.tone}`}>{s.label}</span>
                </div>
                <p className="mt-3 text-xs text-muted">
                  Used {p.used_count}
                  {p.max_uses !== null && ` of ${p.max_uses}`} times
                  {p.expires_at && ` · until ${date(p.expires_at)}`}
                </p>
                <div className="mt-3 flex gap-2 border-t border-sand/70 pt-3">
                  <button type="button" onClick={() => setEditing(p)} className="flex-1 rounded-full border border-sand py-2 text-xs font-semibold">
                    Edit
                  </button>
                  <button type="button" onClick={() => share(p)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-sand py-2 text-xs font-semibold">
                    {copied === p.id ? <Copy className="size-3.5" /> : <Share2 className="size-3.5" />}
                    {copied === p.id ? "Copied" : "Share"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && <PromoSheet promo={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PromoSheet({ promo, onClose }: { promo: PromoCode | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [v, setV] = useState<PromoFormValues>({
    code: promo?.code ?? "",
    kind: promo?.kind ?? "percent",
    value: promo ? (promo.kind === "percent" ? String(promo.value) : (promo.value / 1000).toFixed(3)) : "10",
    min_order: promo?.min_order_fils ? (promo.min_order_fils / 1000).toFixed(3) : "",
    max_uses: promo?.max_uses != null ? String(promo.max_uses) : "",
    starts_at: toDay(promo?.starts_at ?? null),
    expires_at: toDay(promo?.expires_at ?? null),
    is_active: promo?.is_active ?? true,
  });
  const set = <K extends keyof PromoFormValues>(k: K, value: PromoFormValues[K]) => setV((p) => ({ ...p, [k]: value }));
  const err = (k: string) => errors[k] && <span className="mt-1 block text-xs text-crimson">{errors[k]}</span>;

  const save = () =>
    start(async () => {
      const res = await savePromo(promo?.id ?? null, v);
      if (!res.ok) return setErrors(res.errors);
      router.refresh();
      onClose();
    });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-pine-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-[1.75rem] bg-ivory p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-pine-900">{promo ? "Edit promo code" : "New promo code"}</h2>
          <button type="button" onClick={onClose} className="-me-2 p-2" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <Field label="Code">
            <input value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} placeholder="EID2026" className={`${inputClass} font-mono tracking-wider uppercase`} aria-invalid={Boolean(errors.code)} />
            {err("code")}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount type">
              <select value={v.kind} onChange={(e) => set("kind", e.target.value as "percent" | "fixed")} className={inputClass}>
                <option value="percent">Percent off</option>
                <option value="fixed">Amount off (BD)</option>
              </select>
            </Field>
            <Field label={v.kind === "percent" ? "Percent" : "Amount (BD)"}>
              <input value={v.value} onChange={(e) => set("value", e.target.value)} inputMode="decimal" className={inputClass} aria-invalid={Boolean(errors.value)} />
              {err("value")}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum order (BD)">
              <input value={v.min_order} onChange={(e) => set("min_order", e.target.value)} inputMode="decimal" placeholder="None" className={inputClass} />
              {err("min_order")}
            </Field>
            <Field label="Max. uses">
              <input value={v.max_uses} onChange={(e) => set("max_uses", e.target.value)} inputMode="numeric" placeholder="Unlimited" className={inputClass} />
              {err("max_uses")}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input type="date" value={v.starts_at} onChange={(e) => set("starts_at", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Ends">
              <input type="date" value={v.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputClass} aria-invalid={Boolean(errors.expires_at)} />
              {err("expires_at")}
            </Field>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3">
            <span className="text-sm font-medium">Active</span>
            <input type="checkbox" checked={v.is_active} onChange={(e) => set("is_active", e.target.checked)} className="size-5 accent-pine-700" />
          </label>
          {errors.form && <p className="text-xs text-crimson">{errors.form}</p>}
          <button type="button" disabled={pending} onClick={save} className="btn btn-primary w-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {promo ? "Save" : "Create code"}
          </button>
          {promo &&
            (confirmDelete ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deletePromo(promo.id);
                    router.refresh();
                    onClose();
                  })
                }
                className="btn h-11 w-full bg-crimson text-white"
              >
                Yes, delete {promo.code}
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="flex w-full items-center justify-center gap-2 py-1 text-xs font-semibold text-crimson">
                <Trash2 className="size-3.5" />
                Delete code
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
