"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { CustomerSummary } from "@/lib/data";
import { bhd, timeAgo } from "@/lib/admin/format";
import { Empty } from "./ui";

const SORTS = {
  recent: { label: "Recent", fn: (a: CustomerSummary, b: CustomerSummary) => (b.last_order_at ?? "").localeCompare(a.last_order_at ?? "") },
  spent: { label: "Top spenders", fn: (a: CustomerSummary, b: CustomerSummary) => b.total_spent_fils - a.total_spent_fils },
  orders: { label: "Most orders", fn: (a: CustomerSummary, b: CustomerSummary) => b.order_count - a.order_count },
  name: { label: "A–Z", fn: (a: CustomerSummary, b: CustomerSummary) => a.full_name.localeCompare(b.full_name) },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<keyof typeof SORTS>("recent");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s+/g, "");
    return customers
      .filter((c) => !term || [c.full_name, c.phone, c.email ?? ""].join("|").toLowerCase().replace(/\s+/g, "").includes(term))
      .sort(SORTS[sort].fn);
  }, [customers, q, sort]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or email"
          className="h-11 w-full rounded-full border border-sand bg-white ps-10 pe-4 text-base outline-none focus:border-pine-500 sm:text-sm"
        />
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${sort === s ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white text-ink-soft"}`}
          >
            {SORTS[s].label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-5">
          <Empty title={q ? "No one matches" : "No customers yet"} body={q ? undefined : "Customers appear here after their first order."} />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-sand/70 overflow-hidden rounded-[1.25rem] border border-sand/80 bg-white/70">
          {shown.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-linen/60 sm:px-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pine-100 text-xs font-bold text-pine-800">{initials(c.full_name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                    {c.full_name}
                    {c.order_count >= 3 && <span className="rounded-full bg-brass/15 px-2 py-0.5 text-[0.6rem] font-bold text-[#7a5a26]">Regular</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.order_count} order{c.order_count === 1 ? "" : "s"}
                    {c.last_order_at && ` · last ${timeAgo(c.last_order_at)}`}
                    {c.country !== "BH" && ` · ${c.country}`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{bhd(c.total_spent_fils)}</span>
                <ChevronRight className="size-4 shrink-0 text-stone" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
