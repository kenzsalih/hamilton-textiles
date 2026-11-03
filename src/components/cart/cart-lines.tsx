"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/currency/currency-provider";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { lineTotal } from "@/lib/metres";
import { useCart, type CartLine } from "./cart-provider";
import { MetreStepper } from "./metre-stepper";

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { setMetres, remove } = useCart();
  const name = locale === "ar" ? line.name_ar : line.name_en;

  return (
    <li className="flex gap-4 py-5">
      <Link href={`/fabric/${line.slug}`} onClick={onNavigate} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-linen">
        {line.image ? (
          <Image src={line.image} alt={name} fill sizes="80px" className="object-cover" />
        ) : (
          <FabricSwatch hex={line.colour_hex ?? "#d8cfc0"} pattern={line.pattern} className="size-full" drape={false} />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/fabric/${line.slug}`} onClick={onNavigate} className="block truncate font-display text-lg text-pine-900 hover:underline">
              {name}
            </Link>
            <p className="text-xs text-muted">
              <Price fils={line.price_fils} /> {t("perMetre")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(line.materialId)}
            className="-m-1 p-1 text-muted transition-colors hover:text-crimson"
            aria-label={t("remove", { name })}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <MetreStepper
            size="sm"
            value={line.metres}
            min={line.min_order_m}
            step={line.step_m}
            max={line.stock_m}
            onChange={(m) => setMetres(line.materialId, m)}
          />
          <p className="text-sm font-bold text-pine-900">
            <Price fils={lineTotal(line.price_fils, line.metres)} />
          </p>
        </div>
      </div>
    </li>
  );
}

export function FreeDeliveryProgress({ subtotalFils, thresholdFils }: { subtotalFils: number; thresholdFils: number }) {
  const t = useTranslations("cart");
  const remaining = thresholdFils - subtotalFils;
  const pct = Math.min(100, (subtotalFils / thresholdFils) * 100);

  return (
    <div className="rounded-xl bg-linen px-4 py-3">
      <p className="text-xs text-ink-soft">
        {remaining > 0 ? t.rich("freeDeliveryRemaining", { amount: () => <Price fils={remaining} className="font-bold" /> }) : t("freeDeliveryReached")}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-pine-700 transition-[width] duration-700 ease-[var(--ease-silk)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
