"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import { getRepo } from "@/lib/data";

const promoSchema = z
  .object({
    code: z.string().trim().toUpperCase().min(3, "At least 3 characters").max(20).regex(/^[A-Z0-9]+$/, "Letters and numbers only"),
    kind: z.enum(["percent", "fixed"]),
    value: z.string().trim().regex(/^\d+(\.\d{1,3})?$/, "Enter a number"),
    min_order: z.string().trim().regex(/^(\d+(\.\d{1,3})?)?$/, "Enter an amount like 10.000"),
    max_uses: z.string().trim().regex(/^\d*$/, "Whole number"),
    starts_at: z.string(),
    expires_at: z.string(),
    is_active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const n = Number(v.value);
    if (v.kind === "percent" && (n <= 0 || n > 90 || !Number.isInteger(n))) ctx.addIssue({ code: "custom", path: ["value"], message: "1–90%" });
    if (v.kind === "fixed" && n <= 0) ctx.addIssue({ code: "custom", path: ["value"], message: "More than 0" });
    if (v.starts_at && v.expires_at && v.expires_at < v.starts_at) ctx.addIssue({ code: "custom", path: ["expires_at"], message: "Ends before it starts" });
  });

export type PromoFormValues = z.input<typeof promoSchema>;

/** Dates are picked as Bahrain calendar days: start of the first day to the end of the last. */
const bahrainStart = (d: string) => (d ? new Date(`${d}T00:00:00+03:00`).toISOString() : null);
const bahrainEnd = (d: string) => (d ? new Date(`${d}T23:59:59+03:00`).toISOString() : null);

export async function savePromo(id: string | null, values: PromoFormValues): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  await requireAdmin();
  const parsed = promoSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, errors };
  }
  const v = parsed.data;
  try {
    await getRepo().savePromo(
      {
        code: v.code,
        kind: v.kind,
        value: v.kind === "percent" ? Number(v.value) : Math.round(Number(v.value) * 1000),
        min_order_fils: v.min_order ? Math.round(Number(v.min_order) * 1000) : 0,
        max_uses: v.max_uses ? Number(v.max_uses) : null,
        starts_at: bahrainStart(v.starts_at),
        expires_at: bahrainEnd(v.expires_at),
        is_active: v.is_active,
      },
      id ?? undefined,
    );
  } catch (err) {
    const duplicate = String((err as { message?: string })?.message ?? err).includes("duplicate");
    return { ok: false, errors: duplicate ? { code: "This code already exists" } : { form: "Couldn't save. Please try again." } };
  }
  revalidatePath("/admin/promos");
  return { ok: true };
}

export async function deletePromo(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await getRepo().deletePromo(id);
  revalidatePath("/admin/promos");
  return { ok: true };
}
