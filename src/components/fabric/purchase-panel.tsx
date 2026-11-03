"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, MessageCircle, Ruler, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localised, type Material } from "@/lib/catalog/types";
import { lineTotal } from "@/lib/metres";
import { Price, useCurrency } from "@/components/currency/currency-provider";
import { useCart } from "@/components/cart/cart-provider";
import { MetreStepper } from "@/components/cart/metre-stepper";

export function PurchasePanel({ material }: { material: Material }) {
  const t = useTranslations("fabric");
  const locale = useLocale();
  const { add, lines } = useCart();
  const { currency } = useCurrency();
  const inStock = material.stock_m >= material.min_order_m;
  const [metres, setMetres] = useState(Math.min(Math.max(material.min_order_m, 2), material.stock_m || material.min_order_m));
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.materialId === material.id);
  const lowStock = inStock && material.stock_m <= material.low_stock_m;

  const whatsappText = encodeURIComponent(
    t("whatsappMessage", { name: localised(material, "name", locale), sku: material.sku }),
  );

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <Price fils={material.price_fils} className="font-display text-4xl text-pine-900" />
        <span className="text-sm text-muted">{t("perMetre")}</span>
        {material.compare_at_fils && (
          <>
            <Price fils={material.compare_at_fils} className="text-sm text-muted line-through" />
            <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-xs font-bold text-crimson">
              −{Math.round((1 - material.price_fils / material.compare_at_fils) * 100)}%
            </span>
          </>
        )}
      </div>
      {currency !== "BHD" && <p className="mt-1 text-xs text-muted">{t("currencyNote")}</p>}

      <p className={`mt-5 flex items-center gap-2 text-sm font-medium ${inStock ? (lowStock ? "text-brass" : "text-pine-700") : "text-crimson"}`}>
        <span className={`size-2 rounded-full ${inStock ? (lowStock ? "bg-brass" : "bg-pine-500") : "bg-crimson"}`} />
        {inStock ? (lowStock ? t("lowStock", { metres: material.stock_m }) : t("inStock")) : t("outOfStock")}
      </p>

      {inStock && (
        <div className="mt-6 rounded-[1.25rem] border border-sand bg-white/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink-soft">{t("length")}</p>
              <p className="text-xs text-muted">{t("lengthHint", { min: material.min_order_m, step: material.step_m })}</p>
            </div>
            <MetreStepper value={metres} onChange={setMetres} min={material.min_order_m} step={material.step_m} max={material.stock_m} />
          </div>
          <div className="mt-5 flex items-baseline justify-between border-t border-sand pt-4">
            <span className="text-sm text-ink-soft">{t("total")}</span>
            <Price fils={lineTotal(material.price_fils, metres)} className="text-xl font-bold text-pine-900" />
          </div>
          <button
            type="button"
            onClick={() => {
              add(material, metres);
              setAdded(true);
              setTimeout(() => setAdded(false), 2200);
            }}
            className="btn btn-primary mt-4 h-13 w-full text-base"
          >
            {added ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
            {added ? t("added") : t("addToCart")}
          </button>
          {inCart && !added && (
            <p className="mt-3 text-center text-xs text-muted">{t("alreadyInCart", { metres: inCart.metres })}</p>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link href="/#calculator" className="flex items-center gap-3 rounded-xl bg-linen px-4 py-3 text-sm text-ink-soft transition-colors hover:bg-sand">
          <Ruler className="size-4 text-brass" />
          {t("howMuch")}
        </Link>
        <a
          href={`https://wa.me/97338257064?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl bg-linen px-4 py-3 text-sm text-ink-soft transition-colors hover:bg-sand"
        >
          <MessageCircle className="size-4 text-brass" />
          {t("askAbout")}
        </a>
      </div>
    </div>
  );
}
