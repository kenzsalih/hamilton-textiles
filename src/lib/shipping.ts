// Delivery pricing. PLACEHOLDER VALUES — waiting on the owner to confirm fees
// and the international courier. Amounts are in fils.

export const GCC_COUNTRIES = ["SA", "AE", "KW", "QA", "OM"] as const;

export type ShippingZone = "BH" | "GCC" | "INTL";

export const SHIPPING_RATES: Record<ShippingZone, { feeFils: number; freeOverFils: number | null; days: string }> = {
  BH: { feeFils: 1_500, freeOverFils: 15_000, days: "1–2" },
  GCC: { feeFils: 6_000, freeOverFils: null, days: "3–6" },
  INTL: { feeFils: 14_000, freeOverFils: null, days: "6–12" },
};

/** Value-added tax. Set once the owner confirms VAT registration (Bahrain: 10%). */
export const VAT_RATE = 0;

export function zoneFor(country: string): ShippingZone {
  if (country === "BH") return "BH";
  return (GCC_COUNTRIES as readonly string[]).includes(country) ? "GCC" : "INTL";
}

export function shippingFor(fulfilment: "delivery" | "pickup", country: string, subtotalFils: number): number {
  if (fulfilment === "pickup") return 0;
  const rate = SHIPPING_RATES[zoneFor(country)];
  return rate.freeOverFils !== null && subtotalFils >= rate.freeOverFils ? 0 : rate.feeFils;
}

/** Countries offered at checkout, Bahrain first. */
export const COUNTRIES = [
  "BH", "SA", "AE", "KW", "QA", "OM", "IN", "PK", "PH", "BD", "LK", "EG", "JO", "LB",
  "GB", "US", "CA", "AU", "DE", "FR", "IT", "NL", "TR", "MY", "ID", "SG",
] as const;
