"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CURRENCY_CODES, isCurrency } from "@/lib/currency";
import { useCurrency } from "@/components/currency/currency-provider";

export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("switcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      aria-label={t("language")}
      disabled={pending}
      onClick={() => startTransition(() => router.replace(pathname, { locale: next, scroll: false }))}
      className={`text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-40 ${
        next === "ar" ? "font-[family-name:var(--font-plex-arabic)]" : "font-[family-name:var(--font-manrope)]"
      } ${className ?? ""}`}
    >
      {t("other")}
    </button>
  );
}

export function CurrencySelect({ className }: { className?: string }) {
  const t = useTranslations("switcher");
  const { currency, setCurrency } = useCurrency();

  return (
    <label className={`relative inline-flex items-center ${className ?? ""}`}>
      <span className="sr-only">{t("currency")}</span>
      <select
        value={currency}
        onChange={(e) => isCurrency(e.target.value) && setCurrency(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pe-4 text-sm font-semibold outline-none"
        dir="ltr"
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code} className="text-ink">
            {code}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 10 6" className="pointer-events-none absolute end-0 size-2.5 opacity-60" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </label>
  );
}
