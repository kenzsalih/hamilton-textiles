"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localised, type Category, type Material } from "@/lib/catalog/types";
import { COLOUR_FAMILIES, colourFamily, type ColourFamily } from "@/lib/catalog/colour";
import { ProductCard } from "@/components/fabric/product-card";

const SORTS = ["featured", "new", "price-asc", "price-desc"] as const;
type Sort = (typeof SORTS)[number];
const OCCASIONS = ["abaya", "thobe", "jalabiya", "dress", "shirt", "eid", "wedding", "everyday"] as const;

type Filters = {
  q: string;
  cat: string[];
  colour: ColourFamily[];
  occasion: string[];
  sale: boolean;
  sort: Sort;
};

function readFilters(params: URLSearchParams, lockedCategory?: string, onSale?: boolean): Filters {
  const list = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  const sort = params.get("sort") as Sort;
  return {
    q: params.get("q") ?? "",
    cat: lockedCategory ? [lockedCategory] : list("cat"),
    colour: list("colour").filter((c): c is ColourFamily => c in COLOUR_FAMILIES),
    occasion: list("occasion"),
    sale: onSale || params.get("sale") === "1",
    sort: SORTS.includes(sort) ? sort : "featured",
  };
}

export function ShopBrowser({
  materials,
  categories,
  lockedCategory,
  onSale,
}: {
  materials: Material[];
  categories: Category[];
  /** Category slug fixed by the page (collection pages). */
  lockedCategory?: string;
  /** Offers page shows discounted fabrics only. */
  onSale?: boolean;
}) {
  const t = useTranslations("shop");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");

  const filters = readFilters(params, lockedCategory, onSale);
  const categoryBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (!lockedCategory && next.cat.length) sp.set("cat", next.cat.join(","));
    if (next.colour.length) sp.set("colour", next.colour.join(","));
    if (next.occasion.length) sp.set("occasion", next.occasion.join(","));
    if (next.sale && !onSale) sp.set("sale", "1");
    if (next.sort !== "featured") sp.set("sort", next.sort);
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggle = <K extends "cat" | "colour" | "occasion">(key: K, value: Filters[K][number]) => {
    const current = filters[key] as string[];
    update({ [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] } as Partial<Filters>);
  };

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const catIds = new Set(filters.cat.map((s) => categoryBySlug.get(s)?.id).filter(Boolean));
    const list = materials.filter((m) => {
      if (catIds.size && !catIds.has(m.category_id)) return false;
      if (filters.sale && !m.compare_at_fils) return false;
      if (filters.colour.length) {
        const fam = colourFamily(m.colour_hex);
        if (!fam || !filters.colour.includes(fam)) return false;
      }
      if (filters.occasion.length && !filters.occasion.some((o) => m.occasions.includes(o))) return false;
      if (q) {
        const haystack = [m.name_en, m.name_ar, m.colour_name_en, m.colour_name_ar, m.composition, m.sku, m.description_en, m.description_ar]
          .join(" ")
          .toLowerCase();
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
      }
      return true;
    });

    const inStockFirst = (a: Material, b: Material) => Number(b.stock_m > 0) - Number(a.stock_m > 0);
    const sorters: Record<Sort, (a: Material, b: Material) => number> = {
      featured: (a, b) => inStockFirst(a, b) || Number(b.is_featured) - Number(a.is_featured),
      new: (a, b) => inStockFirst(a, b) || b.created_at.localeCompare(a.created_at),
      "price-asc": (a, b) => inStockFirst(a, b) || a.price_fils - b.price_fils,
      "price-desc": (a, b) => inStockFirst(a, b) || b.price_fils - a.price_fils,
    };
    return list.sort(sorters[filters.sort]);
  }, [materials, filters.q, filters.cat, filters.colour, filters.occasion, filters.sale, filters.sort, categoryBySlug]);

  const activeCount =
    (lockedCategory ? 0 : filters.cat.length) + filters.colour.length + filters.occasion.length + (filters.sale && !onSale ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    update({ q: "", cat: [], colour: [], occasion: [], sale: false });
  };

  const panel = (
    <div className="space-y-9">
      {!lockedCategory && (
        <FilterGroup title={t("category")}>
          <div className="flex flex-col gap-1">
            {categories.map((c) => (
              <Check key={c.id} checked={filters.cat.includes(c.slug)} onChange={() => toggle("cat", c.slug)}>
                {localised(c, "name", locale)}
              </Check>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title={t("colour")}>
        <div className="grid grid-cols-6 gap-2.5">
          {(Object.keys(COLOUR_FAMILIES) as ColourFamily[]).map((fam) => {
            const on = filters.colour.includes(fam);
            return (
              <button
                key={fam}
                type="button"
                title={t(`colours.${fam}`)}
                aria-label={t(`colours.${fam}`)}
                aria-pressed={on}
                onClick={() => toggle("colour", fam)}
                className={`aspect-square rounded-full ring-1 ring-black/10 transition-all duration-300 ring-offset-2 ring-offset-ivory ${on ? "scale-110 !ring-2 !ring-pine-800" : "hover:scale-105"}`}
                style={{ background: COLOUR_FAMILIES[fam] }}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title={t("occasion")}>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const on = filters.occasion.includes(o);
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("occasion", o)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-300 ${
                  on ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand text-ink-soft hover:border-pine-500"
                }`}
              >
                {t(`occasions.${o}`)}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {!onSale && (
        <FilterGroup title={t("offers")}>
          <Check checked={filters.sale} onChange={() => update({ sale: !filters.sale })}>
            {t("onSaleOnly")}
          </Check>
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="container-x pb-24">
      {/* Toolbar */}
      <div className="sticky top-18 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-sand bg-ivory/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: query });
          }}
          className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto"
        >
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === "") update({ q: "" });
            }}
            onBlur={() => query !== filters.q && update({ q: query })}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-full border border-sand bg-white/60 ps-11 pe-4 text-sm outline-none transition-colors placeholder:text-stone focus:border-pine-500"
          />
        </form>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-sand px-4 text-sm font-semibold lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          {t("filters")}
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-pine-800 text-[0.65rem] text-ivory">{activeCount}</span>}
        </button>

        <label className="ms-auto inline-flex items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">{t("sortBy")}</span>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as Sort })}
            className="h-11 cursor-pointer rounded-full border border-sand bg-transparent px-4 font-semibold outline-none focus:border-pine-500"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sorts.${s}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-40">{panel}</div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <p className="me-2 text-sm text-muted">{t("results", { count: results.length })}</p>
            {filters.q && <Chip onRemove={() => { setQuery(""); update({ q: "" }); }}>“{filters.q}”</Chip>}
            {!lockedCategory &&
              filters.cat.map((slug) => (
                <Chip key={slug} onRemove={() => toggle("cat", slug)}>
                  {categoryBySlug.get(slug) ? localised(categoryBySlug.get(slug)!, "name", locale) : slug}
                </Chip>
              ))}
            {filters.colour.map((c) => (
              <Chip key={c} onRemove={() => toggle("colour", c)}>
                <span className="size-2.5 rounded-full" style={{ background: COLOUR_FAMILIES[c] }} />
                {t(`colours.${c}`)}
              </Chip>
            ))}
            {filters.occasion.map((o) => (
              <Chip key={o} onRemove={() => toggle("occasion", o)}>
                {t(`occasions.${o}`)}
              </Chip>
            ))}
            {filters.sale && !onSale && <Chip onRemove={() => update({ sale: false })}>{t("onSaleOnly")}</Chip>}
            {(activeCount > 0 || filters.q) && (
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-pine-800 underline underline-offset-4">
                {t("clearAll")}
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-sand px-6 py-20 text-center">
              <p className="font-display text-3xl text-pine-900">{t("noResults")}</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{t("noResultsBody")}</p>
              <button type="button" onClick={clearAll} className="btn btn-primary mt-6">
                {t("clearAll")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3">
              {results.map((m, i) => (
                <ProductCard key={m.id} material={m} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sheetOpen ? "" : "pointer-events-none"}`} aria-hidden={!sheetOpen}>
        <div
          className={`absolute inset-0 bg-pine-900/40 backdrop-blur-sm transition-opacity duration-500 ${sheetOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSheetOpen(false)}
        />
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[1.75rem] bg-ivory shadow-2xl transition-transform duration-500 ease-[var(--ease-silk)] ${
            sheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-sand px-6 py-4">
            <h2 className="font-display text-2xl text-pine-900">{t("filters")}</h2>
            <button type="button" onClick={() => setSheetOpen(false)} className="-me-2 p-2" aria-label={t("close")}>
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-6">{panel}</div>
          <div className="flex gap-3 border-t border-sand px-6 py-4">
            <button type="button" onClick={clearAll} className="btn btn-ghost flex-1 text-pine-900">
              {t("clearAll")}
            </button>
            <button type="button" onClick={() => setSheetOpen(false)} className="btn btn-primary flex-1">
              {t("showResults", { count: results.length })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4">{title}</legend>
      {children}
    </fieldset>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink-soft">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="grid size-4.5 place-items-center rounded-[5px] border border-stone transition-colors peer-checked:border-pine-800 peer-checked:bg-pine-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brass">
        <svg viewBox="0 0 12 12" className={`size-3 text-ivory ${checked ? "" : "invisible"}`} aria-hidden="true">
          <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="group-hover:text-pine-900">{children}</span>
    </label>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  const t = useTranslations("shop");
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-linen py-1 ps-3 pe-1.5 text-xs font-medium text-ink-soft">
      {children}
      <button type="button" onClick={onRemove} className="grid size-5 place-items-center rounded-full hover:bg-sand" aria-label={t("removeFilter")}>
        <X className="size-3" />
      </button>
    </span>
  );
}
