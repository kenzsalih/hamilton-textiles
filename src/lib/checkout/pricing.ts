import { getMaterials, type Material } from "@/lib/catalog";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isValidLength, lineTotal } from "@/lib/metres";
import { shippingFor, VAT_RATE } from "@/lib/shipping";
import type { QuoteInput } from "./schema";

export type PromoCode = {
  id: string | null;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_order_fils: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type PricedLine = {
  material: Material;
  metres: number;
  lineTotalFils: number;
};

export type LineProblem = { materialId: string; reason: "missing" | "stock" | "length"; available?: number };

export type PromoStatus = "applied" | "invalid" | "expired" | "minimum" | null;

export type Quote = {
  lines: PricedLine[];
  problems: LineProblem[];
  subtotalFils: number;
  discountFils: number;
  shippingFils: number;
  vatFils: number;
  totalFils: number;
  promo: PromoCode | null;
  promoStatus: PromoStatus;
};

// Used only while Supabase isn't connected, so the checkout can be tried end to end.
const DEMO_PROMOS: PromoCode[] = [
  { id: null, code: "WELCOME10", kind: "percent", value: 10, min_order_fils: 0, max_uses: null, used_count: 0, starts_at: null, expires_at: null, is_active: true },
];

async function findPromo(code: string): Promise<PromoCode | null> {
  const db = getAdminSupabase();
  if (!db) return DEMO_PROMOS.find((p) => p.code === code) ?? null;
  const { data, error } = await db.from("promo_codes").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data as PromoCode | null;
}

function promoProblem(p: PromoCode, subtotalFils: number): Exclude<PromoStatus, "applied" | null> | null {
  const now = Date.now();
  if (!p.is_active) return "invalid";
  if (p.starts_at && Date.parse(p.starts_at) > now) return "invalid";
  if (p.expires_at && Date.parse(p.expires_at) < now) return "expired";
  if (p.max_uses !== null && p.used_count >= p.max_uses) return "expired";
  if (subtotalFils < p.min_order_fils) return "minimum";
  return null;
}

/**
 * Prices an order from the live catalogue. The browser's cart is never
 * trusted for prices, stock or discounts — everything is recomputed here.
 */
export async function priceOrder(input: QuoteInput): Promise<Quote> {
  const catalogue = new Map((await getMaterials()).map((m) => [m.id, m]));
  const lines: PricedLine[] = [];
  const problems: LineProblem[] = [];

  for (const item of input.items) {
    const material = catalogue.get(item.materialId);
    if (!material) {
      problems.push({ materialId: item.materialId, reason: "missing" });
      continue;
    }
    if (!isValidLength(item.metres, Number(material.min_order_m), Number(material.step_m))) {
      problems.push({ materialId: item.materialId, reason: "length" });
      continue;
    }
    if (item.metres > material.stock_m) {
      problems.push({ materialId: item.materialId, reason: "stock", available: material.stock_m });
      continue;
    }
    lines.push({ material, metres: item.metres, lineTotalFils: lineTotal(material.price_fils, item.metres) });
  }

  const subtotalFils = lines.reduce((sum, l) => sum + l.lineTotalFils, 0);

  let promo: PromoCode | null = null;
  let promoStatus: PromoStatus = null;
  let discountFils = 0;
  if (input.promoCode) {
    const found = await findPromo(input.promoCode);
    const problem = found ? promoProblem(found, subtotalFils) : "invalid";
    if (found && !problem) {
      promo = found;
      promoStatus = "applied";
      discountFils = found.kind === "percent" ? Math.round((subtotalFils * found.value) / 100) : Math.min(found.value, subtotalFils);
    } else {
      promoStatus = problem;
    }
  }

  const afterDiscount = subtotalFils - discountFils;
  const shippingFils = lines.length ? shippingFor(input.fulfilment, input.country, afterDiscount) : 0;
  const vatFils = Math.round((afterDiscount + shippingFils) * VAT_RATE);

  return {
    lines,
    problems,
    subtotalFils,
    discountFils,
    shippingFils,
    vatFils,
    totalFils: afterDiscount + shippingFils + vatFils,
    promo,
    promoStatus,
  };
}
