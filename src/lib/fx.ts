import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "./currency";

export type Rates = Record<CurrencyCode, number>;

const FALLBACK = Object.fromEntries(CURRENCY_CODES.map((c) => [c, CURRENCIES[c].rate])) as Rates;

// Display-only rates (units per 1 BHD), refreshed twice a day from a free, keyless API.
// Any failure falls back to the fixed table so prices always render.
export async function getRates(): Promise<Rates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/BHD", {
      next: { revalidate: 43200 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return FALLBACK;
    const rates = { ...FALLBACK };
    for (const code of CURRENCY_CODES) {
      const r = data.rates[code];
      if (code !== "BHD" && typeof r === "number" && r > 0) rates[code] = r;
    }
    return rates;
  } catch {
    return FALLBACK;
  }
}
