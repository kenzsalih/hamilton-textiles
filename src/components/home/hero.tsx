import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { Price } from "@/components/currency/currency-provider";
import type { FabricPattern } from "@/lib/catalog/types";

const RAIL: { hex: string; pattern: FabricPattern; offset: string; label: string }[] = [
  { hex: "#141317", pattern: "crepe", offset: "mt-16", label: "nida" },
  { hex: "#f5f2ea", pattern: "twill", offset: "mt-0", label: "thobe" },
  { hex: "#6e2438", pattern: "satin", offset: "mt-24", label: "satin" },
  { hex: "#2f4f9a", pattern: "floral", offset: "mt-8", label: "print" },
];

export async function Hero({ inStockCount, lowestPriceFils }: { inStockCount: number; lowestPriceFils: number }) {
  const t = await getTranslations("hero");

  return (
    <section className="grain relative overflow-hidden bg-linen">
      <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
        <div className="relative z-10">
          <p className="eyebrow animate-rise">{t("eyebrow")}</p>
          <h1 className="mt-5 animate-rise font-display text-[2.9rem] leading-[1.02] text-pine-900 [animation-delay:80ms] sm:text-6xl lg:text-[4.6rem] rtl:leading-[1.25]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-lg animate-rise text-base leading-relaxed text-ink-soft [animation-delay:160ms] sm:text-lg">
            {t("body")}
          </p>
          <div className="mt-9 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/shop" className="btn btn-primary">
              {t("ctaPrimary")}
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </Link>
            <Link href="/collections" className="btn btn-ghost text-pine-900">
              {t("ctaSecondary")}
            </Link>
          </div>

          <dl className="mt-14 grid max-w-lg animate-rise grid-cols-3 gap-4 sm:gap-6 border-t border-sand pt-7 [animation-delay:320ms]">
            <div className="flex flex-col">
              <dt className="text-[0.7rem] leading-snug text-muted">{t("statFabrics")}</dt>
              <dd className="order-first font-display text-xl whitespace-nowrap text-pine-900 sm:text-3xl">{inStockCount}+</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[0.7rem] leading-snug text-muted">{t("statFrom")}</dt>
              <dd className="order-first font-display text-xl whitespace-nowrap text-pine-900 sm:text-3xl">
                <Price fils={lowestPriceFils} />
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[0.7rem] leading-snug text-muted">{t("statDelivery")}</dt>
              <dd className="order-first font-display text-xl whitespace-nowrap text-pine-900 sm:text-3xl">{t("statDeliveryValue")}</dd>
            </div>
          </dl>
        </div>

        {/* Hanging fabric rail */}
        <div className="relative -mx-4 sm:mx-0" aria-hidden="true">
          <div className="absolute inset-x-6 top-2 h-1.5 rounded-full bg-gradient-to-b from-brass-light to-brass shadow-md" />
          <div className="grid grid-cols-4 gap-3 px-6 pt-1 sm:gap-4">
            {RAIL.map((f, i) => (
              <div key={f.label} className={`${f.offset} animate-rise`} style={{ animationDelay: `${200 + i * 110}ms` }}>
                <div className="mx-auto h-5 w-px bg-brass/70" />
                <div className="origin-top animate-sway pinked overflow-hidden rounded-t-sm shadow-[0_30px_50px_-25px_rgba(19,40,32,0.55)]" style={{ animationDelay: `${i * -1.7}s` }}>
                  <FabricSwatch hex={f.hex} pattern={f.pattern} className="aspect-[2/5] w-full" />
                </div>
                <p className="mt-3 text-center text-[0.65rem] font-semibold tracking-[0.2em] text-muted uppercase rtl:tracking-normal">{t(`rail.${f.label}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
