"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { getRepo, type MaterialInput } from "@/lib/data";

const PATTERNS = ["plain", "crepe", "twill", "satin", "linen", "stripe", "floral", "lace", "chiffon"] as const;

const bd = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, "Enter an amount like 1.500")
  .transform((v) => Math.round(Number(v) * 1000));

const optionalInt = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v)))
  .pipe(z.number().int().positive().nullable());

const materialSchema = z
  .object({
    name_en: z.string().trim().min(2, "Required").max(80),
    name_ar: z.string().trim().min(2, "Required").max(80),
    category_id: z.string().min(1, "Choose a collection"),
    sku: z.string().trim().toUpperCase().max(24).regex(/^[A-Z0-9-]*$/, "Letters, numbers and dashes only"),
    price: bd.refine((v) => v > 0, "Must be more than 0"),
    compare_at: z.string().trim().transform((v) => v),
    colour_name_en: z.string().trim().max(40),
    colour_name_ar: z.string().trim().max(40),
    colour_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    pattern: z.enum(PATTERNS),
    composition: z.string().trim().max(80),
    width_cm: optionalInt,
    weight_gsm: optionalInt,
    occasions: z.array(z.string()).max(10),
    description_en: z.string().trim().max(1000),
    description_ar: z.string().trim().max(1000),
    min_order_m: z.coerce.number().positive().max(100),
    step_m: z.coerce.number().positive().max(10),
    low_stock_m: z.coerce.number().min(0).max(10000),
    opening_stock_m: z.coerce.number().min(0).max(100000).optional(),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    images: z.array(z.string().min(1)).max(8),
  })
  .superRefine((v, ctx) => {
    if (v.compare_at) {
      const fils = Math.round(Number(v.compare_at) * 1000);
      if (!/^\d+(\.\d{1,3})?$/.test(v.compare_at) || fils <= v.price) {
        ctx.addIssue({ code: "custom", path: ["compare_at"], message: "Must be higher than the price" });
      }
    }
  });

export type MaterialFormValues = z.input<typeof materialSchema>;
export type SaveResult = { ok: true; id: string } | { ok: false; errors: Record<string, string> };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function refreshStorefront() {
  revalidatePath("/admin", "layout");
  revalidatePath("/[locale]", "layout");
}

export async function saveMaterial(id: string | null, values: MaterialFormValues): Promise<SaveResult> {
  await requireAdmin();
  const parsed = materialSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { ok: false, errors };
  }
  const v = parsed.data;
  const repo = getRepo();
  const existing = await repo.listMaterials({ includeHidden: true });
  const others = existing.filter((m) => m.id !== id);
  const current = id ? existing.find((m) => m.id === id) : null;

  // Keep the public link stable once a fabric exists; derive it for new ones.
  let slug = current?.slug ?? (slugify(`${v.name_en} ${v.colour_name_en}`) || "fabric");
  if (!current) {
    const base = slug;
    for (let n = 2; others.some((m) => m.slug === slug); n++) slug = `${base}-${n}`;
  }

  let sku = v.sku;
  if (!sku) {
    const prefix = slugify(v.name_en).replace(/-/g, "").slice(0, 3).toUpperCase() || "FAB";
    do sku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    while (others.some((m) => m.sku === sku));
  }
  if (others.some((m) => m.sku === sku)) return { ok: false, errors: { sku: "Another fabric already uses this code" } };

  const input: MaterialInput = {
    slug,
    sku,
    category_id: v.category_id,
    name_en: v.name_en,
    name_ar: v.name_ar,
    description_en: v.description_en || null,
    description_ar: v.description_ar || null,
    composition: v.composition || null,
    width_cm: v.width_cm,
    weight_gsm: v.weight_gsm,
    colour_name_en: v.colour_name_en || null,
    colour_name_ar: v.colour_name_ar || null,
    colour_hex: v.colour_hex.toLowerCase(),
    pattern: v.pattern,
    occasions: v.occasions,
    price_fils: v.price,
    compare_at_fils: v.compare_at ? Math.round(Number(v.compare_at) * 1000) : null,
    low_stock_m: v.low_stock_m,
    min_order_m: v.min_order_m,
    step_m: v.step_m,
    is_featured: v.is_featured,
    is_active: v.is_active,
    images: v.images,
  };

  try {
    const saved = id ? await repo.updateMaterial(id, input) : await repo.createMaterial(input, v.opening_stock_m ?? 0);
    refreshStorefront();
    return { ok: true, id: saved.id };
  } catch (err) {
    console.error("saveMaterial failed", err);
    return { ok: false, errors: { form: "Couldn't save. Please try again." } };
  }
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadMaterialPhoto(form: FormData): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();
  const file = form.get("photo");
  if (!(file instanceof File)) return { ok: false, error: "No photo received" };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { ok: false, error: "Use a JPG, PNG or WebP photo" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "Photo is too large (max 5 MB)" };
  try {
    const url = await getRepo().uploadImage(await file.arrayBuffer(), file.type);
    return { ok: true, url };
  } catch (err) {
    console.error("upload failed", err);
    return { ok: false, error: "Upload failed. Please try again." };
  }
}

const stockSchema = z.object({
  change: z.number().refine((n) => n !== 0 && Math.abs(n) <= 100000),
  reason: z.enum(["restock", "adjustment"]),
  note: z.string().trim().max(200).optional(),
});

export async function adjustMaterialStock(id: string, raw: z.input<typeof stockSchema>): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = stockSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  await getRepo().adjustStock(id, parsed.data.change, parsed.data.reason, parsed.data.note || null);
  refreshStorefront();
  return { ok: true };
}

export async function deleteMaterial(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await getRepo().deleteMaterial(id);
  refreshStorefront();
  return { ok: true };
}

export async function setMaterialVisibility(id: string, visible: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  const repo = getRepo();
  const m = await repo.getMaterial(id);
  if (!m) return { ok: false };
  const { id: _, created_at: __, stock_m: ___, images, ...rest } = m;
  await repo.updateMaterial(id, { ...rest, images: images.map((i) => i.url), is_active: visible });
  refreshStorefront();
  return { ok: true };
}
