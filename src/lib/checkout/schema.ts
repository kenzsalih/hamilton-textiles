import { z } from "zod";
import { COUNTRIES } from "@/lib/shipping";
import { isCurrency } from "@/lib/currency";

export const cartItemSchema = z.object({
  materialId: z.uuid(),
  metres: z.number().positive().max(1000),
});

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  promoCode: z.string().trim().toUpperCase().max(32).optional(),
  fulfilment: z.enum(["delivery", "pickup"]),
  country: z.enum(COUNTRIES),
});

export const checkoutSchema = quoteSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, ""))
    .pipe(z.string().min(6).max(15)),
  address: z
    .object({
      area: z.string().trim().max(120).optional(),
      block: z.string().trim().max(20).optional(),
      road: z.string().trim().max(60).optional(),
      building: z.string().trim().max(60).optional(),
      flat: z.string().trim().max(20).optional(),
      line1: z.string().trim().max(200).optional(),
      line2: z.string().trim().max(200).optional(),
      city: z.string().trim().max(120).optional(),
      postcode: z.string().trim().max(20).optional(),
    })
    .optional(),
  note: z.string().trim().max(500).optional(),
  locale: z.enum(["en", "ar"]),
  displayCurrency: z.string().refine(isCurrency),
  /** Honeypot — real shoppers never fill this in. */
  website: z.string().max(0).optional(),
}).superRefine((data, ctx) => {
  if (data.fulfilment !== "delivery") return;
  const a = data.address ?? {};
  const required = data.country === "BH" ? (["area", "block", "road", "building"] as const) : (["line1", "city"] as const);
  for (const key of required) {
    if (!a[key]) ctx.addIssue({ code: "custom", path: ["address", key], message: "required" });
  }
});

export type QuoteInput = z.infer<typeof quoteSchema>;
export type CheckoutInput = z.input<typeof checkoutSchema>;
