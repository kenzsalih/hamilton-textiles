"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { checkoutSchema, quoteSchema, type CheckoutInput } from "@/lib/checkout/schema";
import { priceOrder, type LineProblem, type PromoStatus } from "@/lib/checkout/pricing";
import { sendOrderEmails } from "@/lib/email";
import { getRepo } from "@/lib/data";
import { createCharge, isTapConfigured } from "@/lib/payments/tap";
import { DIAL_CODES } from "@/lib/countries";
import { SITE_URL } from "@/lib/site";

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
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL) return SITE_URL;
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

  const repo = getRepo();
  // Without Tap, payments are simulated only in development: always with the local store,
  // and against a real database only when DEMO_PAYMENTS=1 is set for testing.
  const simulatePayment = !isTapConfigured();
  const demoAllowed = process.env.NODE_ENV !== "production" && (repo.mode === "dev" || process.env.DEMO_PAYMENTS === "1");
  if (simulatePayment && !demoAllowed) {
    return { ok: false, error: "unavailable" };
  }

  const dialCode = DIAL_CODES[input.country];
  const localPhone = input.phone.startsWith(dialCode) && input.phone.length > 8 ? input.phone.slice(dialCode.length) : input.phone;

  let order: { id: string; order_number: string };
  try {
    const customerId = await repo.upsertCustomer({
      full_name: input.fullName,
      email: input.email,
      phone: `+${dialCode}${localPhone}`,
      country: input.country,
    });

    order = await repo.createOrder(
      {
        customer_id: customerId,
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
        payment_provider: simulatePayment ? "demo" : "tap",
        customer_note: input.note || null,
      },
      quote.lines.map((l) => ({
        material_id: l.material.id,
        name_en: l.material.name_en,
        name_ar: l.material.name_ar,
        sku: l.material.sku,
        price_fils: l.material.price_fils,
        metres: l.metres,
        line_total_fils: l.lineTotalFils,
      })),
    );
  } catch (err) {
    console.error("placeOrder failed", err);
    return { ok: false, error: "server" };
  }

  if (simulatePayment) {
    // Development without Tap keys: treat the order as paid so the admin app has real orders to work with.
    if (await repo.markOrderPaid(order.id, `demo_${order.order_number}`, "card")) await sendOrderEmails(order.id);
    return { ok: true, redirectUrl: `/${input.locale}/checkout/return?demo=${order.order_number}` };
  }

  try {
    const origin = await siteOrigin();
    const charge = await createCharge({
      orderId: order.id,
      orderNumber: order.order_number,
      amountFils: quote.totalFils,
      customer: { name: input.fullName, email: input.email, dialCode, phone: localPhone },
      redirectUrl: `${origin}/${input.locale}/checkout/return`,
      webhookUrl: `${origin}/api/webhooks/tap`,
      description: `Hamilton Textiles order ${order.order_number}`,
    });
    await repo.setOrderPaymentRef(order.id, charge.id);
    if (!charge.transaction?.url) throw new Error("Tap returned no payment URL");
    return { ok: true, redirectUrl: charge.transaction.url };
  } catch (err) {
    console.error("Tap charge failed", err);
    await repo.setOrderStatus(order.id, "cancelled", "Payment could not be started").catch(() => {});
    return { ok: false, error: "payment" };
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

  const order = await getRepo().getOrderByNumber(parsed.data.orderNumber);
  // Match on the last 8 digits so "+973 3xxx" and "3xxx" both work, and give the
  // same answer for a wrong phone as for a missing order.
  const phone = order?.customer.phone.replace(/[^\d]/g, "") ?? "";
  if (!order || phone.slice(-8) !== parsed.data.phone.slice(-8)) return { ok: false, error: "notFound" };

  return {
    ok: true,
    order: {
      orderNumber: order.order_number,
      status: order.status,
      fulfilment: order.fulfilment,
      createdAt: order.created_at,
      totalFils: order.total_fils,
      events: order.events.map((e) => ({ status: e.status, at: e.created_at })),
      items: order.items.map(({ name_en, name_ar, metres }) => ({ name_en, name_ar, metres })),
    },
  };
}
