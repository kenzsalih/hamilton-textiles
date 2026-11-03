"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { checkoutSchema, quoteSchema, type CheckoutInput } from "@/lib/checkout/schema";
import { priceOrder, type LineProblem, type PromoStatus } from "@/lib/checkout/pricing";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { createCharge, isTapConfigured } from "@/lib/payments/tap";
import { DIAL_CODES } from "@/lib/countries";

export type QuoteSummary = {
  subtotalFils: number;
  discountFils: number;
  shippingFils: number;
  vatFils: number;
  totalFils: number;
  promoStatus: PromoStatus;
  problems: LineProblem[];
};

export async function quoteOrder(raw: unknown): Promise<QuoteSummary | null> {
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return null;
  const q = await priceOrder(parsed.data);
  return {
    subtotalFils: q.subtotalFils,
    discountFils: q.discountFils,
    shippingFils: q.shippingFils,
    vatFils: q.vatFils,
    totalFils: q.totalFils,
    promoStatus: q.promoStatus,
    problems: q.problems,
  };
}

export type PlaceOrderResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: "validation"; fields: string[] }
  | { ok: false; error: "cart"; problems: LineProblem[] }
  | { ok: false; error: "promo"; promoStatus: PromoStatus }
  | { ok: false; error: "unavailable" | "payment" | "server" };

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function placeOrder(raw: CheckoutInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fields: parsed.error.issues.map((i) => i.path.join(".")) };
  }
  const input = parsed.data;

  const quote = await priceOrder(input);
  if (quote.problems.length) return { ok: false, error: "cart", problems: quote.problems };
  if (input.promoCode && quote.promoStatus !== "applied") return { ok: false, error: "promo", promoStatus: quote.promoStatus };

  const db = getAdminSupabase();
  if (!db || !isTapConfigured()) {
    // Not connected yet: in development, walk through to a demo confirmation.
    if (process.env.NODE_ENV === "production") return { ok: false, error: "unavailable" };
    return { ok: true, redirectUrl: `/${input.locale}/checkout/return?demo=1&total=${quote.totalFils}` };
  }

  const dialCode = DIAL_CODES[input.country];
  const localPhone = input.phone.startsWith(dialCode) && input.phone.length > 8 ? input.phone.slice(dialCode.length) : input.phone;

  try {
    const { data: customer, error: customerError } = await db
      .from("customers")
      .upsert(
        { full_name: input.fullName, email: input.email, phone: `+${dialCode}${localPhone}`, country: input.country },
        { onConflict: "phone" },
      )
      .select("id")
      .single();
    if (customerError) throw customerError;

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        customer_id: customer.id,
        fulfilment: input.fulfilment,
        shipping_address: input.fulfilment === "delivery" ? { ...input.address, country: input.country } : null,
        subtotal_fils: quote.subtotalFils,
        discount_fils: quote.discountFils,
        shipping_fils: quote.shippingFils,
        vat_fils: quote.vatFils,
        total_fils: quote.totalFils,
        promo_code_id: quote.promo?.id ?? null,
        display_currency: input.displayCurrency,
        locale: input.locale,
        payment_provider: "tap",
        customer_note: input.note || null,
      })
      .select("id, order_number")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await db.from("order_items").insert(
      quote.lines.map((l) => ({
        order_id: order.id,
        material_id: l.material.id,
        name_en: l.material.name_en,
        name_ar: l.material.name_ar,
        sku: l.material.sku,
        price_fils: l.material.price_fils,
        metres: l.metres,
        line_total_fils: l.lineTotalFils,
      })),
    );
    if (itemsError) throw itemsError;

    const origin = await siteOrigin();
    try {
      const charge = await createCharge({
        orderId: order.id,
        orderNumber: order.order_number,
        amountFils: quote.totalFils,
        customer: { name: input.fullName, email: input.email, dialCode, phone: localPhone },
        redirectUrl: `${origin}/${input.locale}/checkout/return`,
        webhookUrl: `${origin}/api/webhooks/tap`,
        description: `Hamilton Textiles order ${order.order_number}`,
      });
      await db.from("orders").update({ payment_ref: charge.id }).eq("id", order.id);
      if (!charge.transaction?.url) throw new Error("Tap returned no payment URL");
      return { ok: true, redirectUrl: charge.transaction.url };
    } catch (err) {
      console.error("Tap charge failed", err);
      await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      return { ok: false, error: "payment" };
    }
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, error: "server" };
  }
}

const trackSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^HT-\d{3,10}$/),
  phone: z.string().transform((v) => v.replace(/[^\d]/g, "")).pipe(z.string().min(6).max(15)),
});

export type TrackedOrder = {
  orderNumber: string;
  status: string;
  fulfilment: "delivery" | "pickup";
  createdAt: string;
  totalFils: number;
  events: { status: string; at: string }[];
  items: { name_en: string; name_ar: string; metres: number }[];
};

export async function trackOrder(raw: unknown): Promise<{ ok: true; order: TrackedOrder } | { ok: false; error: "invalid" | "notFound" | "unavailable" }> {
  const parsed = trackSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const db = getAdminSupabase();
  if (!db) return { ok: false, error: "unavailable" };

  const { data } = await db
    .from("orders")
    .select("order_number, status, fulfilment, created_at, total_fils, customer:customers(phone), events:order_events(status, created_at), items:order_items(name_en, name_ar, metres)")
    .eq("order_number", parsed.data.orderNumber)
    .maybeSingle();

  // Match on the last 8 digits so "+973 3xxx" and "3xxx" both work, and give the
  // same answer for a wrong phone as for a missing order.
  const phone = (data?.customer as { phone?: string } | null)?.phone?.replace(/[^\d]/g, "") ?? "";
  if (!data || phone.slice(-8) !== parsed.data.phone.slice(-8)) return { ok: false, error: "notFound" };

  return {
    ok: true,
    order: {
      orderNumber: data.order_number,
      status: data.status,
      fulfilment: data.fulfilment,
      createdAt: data.created_at,
      totalFils: data.total_fils,
      events: (data.events ?? [])
        .map((e: { status: string; created_at: string }) => ({ status: e.status, at: e.created_at }))
        .sort((a: { at: string }, b: { at: string }) => a.at.localeCompare(b.at)),
      items: (data.items ?? []).map((i: { name_en: string; name_ar: string; metres: number }) => ({ ...i, metres: Number(i.metres) })),
    },
  };
}
