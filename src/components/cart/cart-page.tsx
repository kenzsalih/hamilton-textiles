"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/currency/currency-provider";
import { SHIPPING_RATES } from "@/lib/shipping";
import { useCart } from "./cart-provider";
import { CartLineItem, FreeDeliveryProgress } from "./cart-lines";

export function CartPageContent() {
  const t = useTranslations("cart");
  const { lines, subtotalFils, ready } = useCart();
  const freeOver = SHIPPING_RATES.BH.freeOverFils;

  return (
    <div className="container-x pt-10 pb-24">
      <h1 className="font-display text-5xl text-pine-900">{t("title")}</h1>

      {!ready ? null : lines.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display text-3xl text-pine-900">{t("empty")}</p>
          <p className="mt-3 text-muted">{t("emptyBody")}</p>
          <Link href="/shop" className="btn btn-primary mt-8">
            {t("startShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
          <ul className="divide-y divide-sand border-y border-sand">
            {lines.map((line) => (
              <CartLineItem key={line.materialId} line={line} />
            ))}
          </ul>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-[1.5rem] bg-linen p-6">
              {freeOver && <FreeDeliveryProgress subtotalFils={subtotalFils} thresholdFils={freeOver} />}
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">{t("subtotal")}</span>
                <Price fils={subtotalFils} className="font-display text-3xl text-pine-900" />
              </div>
              <p className="text-xs text-muted">{t("taxesNote")}</p>
              <Link href="/checkout" className="btn btn-primary w-full">
                {t("checkout")}
              </Link>
              <Link href="/shop" className="block text-center text-sm font-semibold text-pine-800 hover:underline">
                {t("continueShopping")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
