"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { CURRENCY_COOKIE, formatPrice, type CurrencyCode } from "@/lib/currency";
import type { Rates } from "@/lib/fx";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  format: (fils: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ initial, rates, children }: { initial: CurrencyCode; rates: Rates; children: ReactNode }) {
  const locale = useLocale();
  const [currency, setState] = useState(initial);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setState(code);
    document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const format = useCallback((fils: number) => formatPrice(fils, currency, locale, rates[currency]), [currency, locale, rates]);

  return <CurrencyContext value={{ currency, setCurrency, format }}>{children}</CurrencyContext>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}

export function Price({ fils, className }: { fils: number; className?: string }) {
  const { format } = useCurrency();
  return (
    <span className={className} dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {format(fils)}
    </span>
  );
}
