"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { FabricPattern, Material } from "@/lib/data";
import { bhd } from "@/lib/admin/format";
import { saveMaterial, type MaterialFormValues } from "@/app/admin/(console)/materials/actions";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { PhotoPicker } from "./photo-picker";
import { Card, Field, inputClass } from "./ui";

const PATTERNS: { value: FabricPattern; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "crepe", label: "Crepe" },
  { value: "twill", label: "Twill" },
  { value: "satin", label: "Satin / silk" },
  { value: "linen", label: "Linen" },
  { value: "chiffon", label: "Chiffon / sheer" },
  { value: "stripe", label: "Stripe" },
  { value: "floral", label: "Print / floral" },
  { value: "lace", label: "Lace" },
];

const OCCASIONS = ["abaya", "thobe", "jalabiya", "dress", "shirt", "eid", "wedding", "everyday"];

const fromFils = (fils: number | null | undefined) => (fils ? (fils / 1000).toFixed(3) : "");

export function MaterialForm({ material, categories }: { material?: Material; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [colourTouched, setColourTouched] = useState(Boolean(material));

  const [v, setV] = useState<MaterialFormValues>(() => ({
    name_en: material?.name_en ?? "",
    name_ar: material?.name_ar ?? "",
    category_id: material?.category_id ?? "",
    sku: material?.sku ?? "",
    price: fromFils(material?.price_fils),
    compare_at: fromFils(material?.compare_at_fils),
    colour_name_en: material?.colour_name_en ?? "",
    colour_name_ar: material?.colour_name_ar ?? "",
    colour_hex: material?.colour_hex ?? "#c8b99a",
    pattern: material?.pattern ?? "plain",
    composition: material?.composition ?? "",
    width_cm: material?.width_cm ? String(material.width_cm) : "150",
    weight_gsm: material?.weight_gsm ? String(material.weight_gsm) : "",
    occasions: material?.occasions ?? [],
    description_en: material?.description_en ?? "",
    description_ar: material?.description_ar ?? "",
    min_order_m: material?.min_order_m ?? 0.5,
    step_m: material?.step_m ?? 0.5,
    low_stock_m: material?.low_stock_m ?? 10,
    opening_stock_m: material ? undefined : 0,
    is_featured: material?.is_featured ?? false,
    is_active: material?.is_active ?? true,
    images: material?.images.map((i) => i.url) ?? [],
  }));

  const set = <K extends keyof MaterialFormValues>(key: K, value: MaterialFormValues[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (errors[key as string]) setErrors(({ [key as string]: _, ...rest }) => rest);
  };

  const text = (key: keyof MaterialFormValues, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      {...props}
      value={String(v[key] ?? "")}
      onChange={(e) => set(key, e.target.value as never)}
      aria-invalid={Boolean(errors[key])}
      className={inputClass}
    />
  );
  const err = (key: string) => errors[key] && <span className="mt-1 block text-xs text-crimson">{errors[key]}</span>;

  const submit = () =>
    start(async () => {
      const res = await saveMaterial(material?.id ?? null, v);
      if (!res.ok) {
        setErrors(res.errors);
        document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setSaved(true);
      if (!material) router.replace(`/admin/materials/${res.id}?created=1`);
      else router.refresh();
    });

  const priceFils = /^\d+(\.\d{1,3})?$/.test(String(v.price)) ? Math.round(Number(v.price) * 1000) : 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-4 pb-20 lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6 lg:pb-0"
    >
      <div className="space-y-4">
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold">Photos</h2>
          <PhotoPicker
            value={v.images}
            onChange={(urls) => set("images", urls)}
            onColourSampled={(hex) => !colourTouched && set("colour_hex", hex)}
          />
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Name &amp; collection</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)">
              {text("name_en", { placeholder: "e.g. Royal Nida", required: true })}
              {err("name_en")}
            </Field>
            <Field label="Name (Arabic)">
              {text("name_ar", { placeholder: "مثال: ندى ملكي", dir: "rtl", required: true })}
              {err("name_ar")}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Collection">
              <select value={v.category_id} onChange={(e) => set("category_id", e.target.value)} aria-invalid={Boolean(errors.category_id)} className={inputClass} required>
                <option value="" disabled>
                  Choose…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err("category_id")}
            </Field>
            <Field label="Product code" hint="Leave empty to create one automatically">
              {text("sku", { placeholder: "AB-NID-001", autoCapitalize: "characters" })}
              {err("sku")}
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Price per metre</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (BD)">
              {text("price", { inputMode: "decimal", placeholder: "1.800", required: true })}
              {err("price")}
            </Field>
            <Field label="Was (BD)" hint="Fill in to show it as an offer">
              {text("compare_at", { inputMode: "decimal", placeholder: "Optional" })}
              {err("compare_at")}
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Colour &amp; weave</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Colour name (English)">{text("colour_name_en", { placeholder: "Jet Black" })}</Field>
            <Field label="Colour name (Arabic)">{text("colour_name_ar", { placeholder: "أسود فاحم", dir: "rtl" })}</Field>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-end gap-4">
            <Field label="Colour">
              <input
                type="color"
                value={v.colour_hex}
                onChange={(e) => {
                  setColourTouched(true);
                  set("colour_hex", e.target.value);
                }}
                className="mt-1.5 block h-12 w-16 cursor-pointer rounded-xl border border-sand bg-white p-1"
              />
            </Field>
            <Field label="Weave / look">
              <select value={v.pattern} onChange={(e) => set("pattern", e.target.value as FabricPattern)} className={inputClass}>
                {PATTERNS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {!colourTouched && v.images.length > 0 && <p className="text-[0.7rem] text-muted">Colour picked from your first photo — adjust it if needed.</p>}
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Composition" className="col-span-2 sm:col-span-1">{text("composition", { placeholder: "100% Polyester" })}</Field>
            <Field label="Width (cm)">{text("width_cm", { inputMode: "numeric" })}{err("width_cm")}</Field>
            <Field label="Weight (g/m²)">{text("weight_gsm", { inputMode: "numeric", placeholder: "Optional" })}{err("weight_gsm")}</Field>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-soft">Good for</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASIONS.map((o) => {
                const on = v.occasions.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set("occasions", on ? v.occasions.filter((x) => x !== o) : [...v.occasions, o])}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      on ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white text-ink-soft"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Description (English)">
            <textarea value={v.description_en} onChange={(e) => set("description_en", e.target.value)} rows={3} className={`${inputClass} h-auto py-3`} />
          </Field>
          <Field label="Description (Arabic)">
            <textarea value={v.description_ar} onChange={(e) => set("description_ar", e.target.value)} rows={3} dir="rtl" className={`${inputClass} h-auto py-3`} />
          </Field>
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Selling</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Min. order (m)">
              <select value={String(v.min_order_m)} onChange={(e) => set("min_order_m", Number(e.target.value))} className={inputClass}>
                {[0.5, 1, 1.5, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n} m</option>)}
              </select>
            </Field>
            <Field label="Sold in steps of">
              <select value={String(v.step_m)} onChange={(e) => set("step_m", Number(e.target.value))} className={inputClass}>
                {[0.25, 0.5, 1].map((n) => <option key={n} value={n}>{n} m</option>)}
              </select>
            </Field>
            <Field label="Low-stock alert at (m)">{text("low_stock_m", { inputMode: "decimal" })}</Field>
            {!material && <Field label="Opening stock (m)">{text("opening_stock_m", { inputMode: "decimal" })}</Field>}
          </div>
          <Toggle checked={v.is_active} onChange={(c) => set("is_active", c)} label="Show on website" hint="Turn off to hide it without deleting" />
          <Toggle checked={v.is_featured} onChange={(c) => set("is_featured", c)} label="Feature on home page" hint="Appears in “Featured this week”" />
        </Card>
      </div>

      {/* Preview + save */}
      <div className="space-y-4 lg:sticky lg:top-6">
        <Card className="hidden overflow-hidden lg:block">
          <div className="relative aspect-[4/5] bg-linen">
            {v.images[0] ? (
              <Image src={v.images[0]} alt="" fill sizes="320px" className="object-cover" />
            ) : (
              <FabricSwatch hex={v.colour_hex} pattern={v.pattern as FabricPattern} className="size-full" />
            )}
          </div>
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-display text-xl text-pine-900">{v.name_en || "Fabric name"}</p>
              <p className="text-xs text-muted">{v.colour_name_en || "Colour"}</p>
            </div>
            <p className="text-sm font-bold">{priceFils ? bhd(priceFils) : "BD —"}</p>
          </div>
          <p className="border-t border-sand/70 px-4 py-2.5 text-[0.7rem] text-muted">Preview of the shop card</p>
        </Card>

        <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 border-t border-sand bg-ivory/95 px-4 py-3 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0">
          {errors.form && <p className="mb-2 text-xs text-crimson">{errors.form}</p>}
          {Object.keys(errors).length > 0 && !errors.form && <p className="mb-2 text-xs text-crimson">Please fix the highlighted fields.</p>}
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
            {pending ? "Saving…" : saved ? "Saved" : material ? "Save changes" : "Add fabric"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (c: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-[0.7rem] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-sand transition-colors peer-checked:bg-pine-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brass after:absolute after:start-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
    </label>
  );
}
