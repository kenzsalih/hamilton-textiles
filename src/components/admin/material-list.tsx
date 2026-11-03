"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EyeOff, Search, Star } from "lucide-react";
import type { Material } from "@/lib/data";
import { bhd, metres } from "@/lib/admin/format";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { Empty } from "./ui";

type Filter = "all" | "low" | "hidden";

export function MaterialList({
  materials,
  categories,
  initialFilter,
}: {
  materials: Material[];
  categories: { id: string; name: string }[];
  initialFilter: Filter;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [category, setCategory] = useState("");
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const counts = {
    all: materials.length,
    low: materials.filter((m) => m.stock_m <= m.low_stock_m).length,
    hidden: materials.filter((m) => !m.is_active).length,
  };

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return materials
      .filter((m) => (filter === "low" ? m.stock_m <= m.low_stock_m : filter === "hidden" ? !m.is_active : true))
      .filter((m) => !category || m.category_id === category)
      .filter((m) => !term || [m.name_en, m.name_ar, m.sku, m.colour_name_en].join(" ").toLowerCase().includes(term))
      .sort((a, b) => (filter === "low" ? a.stock_m - b.stock_m : a.name_en.localeCompare(b.name_en)));
  }, [materials, q, filter, category]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or code"
          className="h-11 w-full rounded-full border border-sand bg-white ps-10 pe-4 text-base outline-none focus:border-pine-500 sm:text-sm"
        />
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {(["all", "low", "hidden"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white text-ink-soft"
            }`}
          >
            {f === "all" ? "All" : f === "low" ? "Low stock" : "Hidden"} <span className="opacity-60">{counts[f]}</span>
          </button>
        ))}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="shrink-0 rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft outline-none"
        >
          <option value="">All collections</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <div className="mt-5">
          <Empty title="No fabrics here" body={q ? "Try a different search." : "Nothing matches this filter."} />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-sand/70 overflow-hidden rounded-[1.25rem] border border-sand/80 bg-white/70">
          {shown.map((m) => {
            const low = m.stock_m <= m.low_stock_m;
            return (
              <li key={m.id}>
                <Link href={`/admin/materials/${m.id}`} className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-linen/60 sm:px-4">
                  <div className={`relative size-14 shrink-0 overflow-hidden rounded-xl bg-linen ${m.is_active ? "" : "opacity-50"}`}>
                    {m.images[0] ? (
                      <Image src={m.images[0].url} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <FabricSwatch hex={m.colour_hex ?? "#d8cfc0"} pattern={m.pattern} drape={false} className="size-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                      {m.name_en}
                      {m.is_featured && <Star className="size-3 shrink-0 fill-brass text-brass" aria-label="Featured" />}
                      {!m.is_active && <EyeOff className="size-3.5 shrink-0 text-muted" aria-label="Hidden" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {m.colour_name_en} · {categoryName.get(m.category_id)} · {m.sku}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-semibold">{bhd(m.price_fils)}</p>
                    <p className={`text-xs font-medium ${m.stock_m === 0 ? "text-crimson" : low ? "text-[#9a6a1f]" : "text-muted"}`}>
                      {m.stock_m === 0 ? "Sold out" : metres(m.stock_m)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
