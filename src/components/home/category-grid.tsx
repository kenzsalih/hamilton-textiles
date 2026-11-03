import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { localised, type Category } from "@/lib/catalog/types";

export async function CategoryGrid({
  categories,
  showHeading = true,
}: {
  categories: (Category & { count: number })[];
  showHeading?: boolean;
}) {
  const t = await getTranslations("categories");
  const locale = await getLocale();

  return (
    <section className={`container-x ${showHeading ? "py-20 lg:py-28" : "py-12 lg:py-16"}`}>
      {showHeading && (
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 font-display text-4xl text-pine-900 sm:text-5xl">{t("title")}</h2>
        </div>
        <Link href="/collections" className="hidden items-center gap-1.5 text-sm font-semibold text-pine-800 hover:text-pine-900 sm:inline-flex">
          {t("viewAll")}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>
      )}

      <div className={`${showHeading ? "mt-10" : ""} grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4`}>
        {categories.map((c, i) => {
          const wide = [0, 5, 6, 7].includes(i);
          return (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className={`group relative overflow-hidden rounded-[1.25rem] ${wide ? "lg:col-span-2" : ""}`}
            >
              <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto lg:h-80">
                <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[var(--ease-silk)] group-hover:scale-105">
                  <FabricSwatch hex={c.accent_hex ?? "#cbbd9f"} pattern={c.accent_pattern ?? "plain"} className="size-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-pine-900/80 via-pine-900/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-6">
                  <div>
                    <h3 className="font-display text-2xl leading-tight text-ivory sm:text-3xl">{localised(c, "name", locale)}</h3>
                    <p className="mt-1 text-xs text-ivory/75">{t("count", { count: c.count })}</p>
                    {wide && (
                      <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-ivory/80 lg:block">
                        {localised(c, "description", locale)}
                      </p>
                    )}
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ivory/15 text-ivory backdrop-blur-md transition-colors duration-500 group-hover:bg-ivory group-hover:text-pine-900">
                    <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
