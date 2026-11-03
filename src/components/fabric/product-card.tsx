"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localised, type Material } from "@/lib/catalog/types";
import { Price } from "@/components/currency/currency-provider";
import { FabricSwatch } from "./fabric-swatch";
import { useCart } from "@/components/cart/cart-provider";

export function ProductCard({ material, priority }: { material: Material; priority?: boolean }) {
  const t = useTranslations("featured");
  const locale = useLocale();
  const { add } = useCart();
  const name = localised(material, "name", locale);
  const colour = localised(material, "colour_name", locale);
  const photo = material.images[0];
  const lowStock = material.stock_m > 0 && material.stock_m <= material.low_stock_m;
  const isNew = Date.now() - new Date(material.created_at).getTime() < 1000 * 60 * 60 * 24 * 30;

  return (
    <article className="group relative">
      <Link href={`/fabric/${material.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-linen">
          <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-[1.06]">
            {photo ? (
              <Image
                src={photo.url}
                alt={localised(photo, "alt", locale) || name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
                priority={priority}
              />
            ) : (
              <FabricSwatch hex={material.colour_hex ?? "#d8cfc0"} pattern={material.pattern} className="size-full" />
            )}
          </div>

          <div className="absolute start-3 top-3 flex gap-1.5">
            {material.compare_at_fils && (
              <span className="rounded-full bg-crimson px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-white uppercase rtl:normal-case">
                {t("sale")}
              </span>
            )}
            {isNew && !material.compare_at_fils && (
              <span className="rounded-full bg-ivory/90 px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-pine-900 uppercase backdrop-blur rtl:normal-case">
                {t("new")}
              </span>
            )}
          </div>

          {lowStock && (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink/70 px-3 py-1.5 text-center text-[0.7rem] font-medium text-ivory backdrop-blur-md">
              {t("lowStock", { metres: material.stock_m })}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl text-pine-900">{name}</h3>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
              <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: material.colour_hex ?? undefined }} />
              {colour}
              {material.width_cm && <span className="hidden text-stone sm:inline">· {material.width_cm} cm</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-baseline gap-1.5 sm:block sm:text-end">
            <p className="text-sm font-bold text-pine-900">
              <Price fils={material.price_fils} />
            </p>
            {material.compare_at_fils ? (
              <p className="text-xs text-muted line-through">
                <Price fils={material.compare_at_fils} />
              </p>
            ) : (
              <p className="text-[0.7rem] text-muted">{t("perMetre")}</p>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => add(material, Math.max(material.min_order_m, Math.min(1, material.stock_m)))}
        disabled={material.stock_m <= 0}
        aria-label={`${t("addToCart")} — ${name}`}
        className="absolute end-3 top-3 grid size-10 translate-y-1 place-items-center rounded-full bg-ivory text-pine-900 opacity-0 shadow-lg transition-all duration-500 ease-[var(--ease-silk)] group-hover:translate-y-0 group-hover:opacity-100 hover:bg-pine-800 hover:text-ivory focus-visible:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
      >
        <Plus className="size-4" strokeWidth={2} />
      </button>
    </article>
  );
}
