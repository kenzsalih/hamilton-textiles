// All prices are stored in fils (1 BHD = 1000 fils) and always charged in BHD.
// Other currencies are display-only conversions; rates are units per 1 BHD.
// TODO(phase 4): refresh rates daily from an FX API instead of these fixed values.

export const CURRENCIES = {
  BHD: { decimals: 3, rate: 1 },
  SAR: { decimals: 2, rate: 9.95 },
  AED: { decimals: 2, rate: 9.74 },
  KWD: { decimals: 3, rate: 0.815 },
  QAR: { decimals: 2, rate: 9.66 },
  OMR: { decimals: 3, rate: 1.021 },
  USD: { decimals: 2, rate: 2.652 },
  EUR: { decimals: 2, rate: 2.45 },
  GBP: { decimals: 2, rate: 2.08 },
  INR: { decimals: 0, rate: 222.5 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "BHD";
export const CURRENCY_COOKIE = "ht_currency";

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in CURRENCIES;
}

export function formatPrice(fils: number, currency: CurrencyCode, locale: string): string {
  const { decimals, rate } = CURRENCIES[currency];
  return new Intl.NumberFormat(locale === "ar" ? "ar-BH" : "en-BH", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format((fils / 1000) * rate);
}
