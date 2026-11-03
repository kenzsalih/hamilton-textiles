"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search, Store, Truck } from "lucide-react";
import type { OrderDetail } from "@/lib/data";
import { bhd, metres, timeAgo } from "@/lib/admin/format";
import { Empty, StatusPill } from "./ui";

export function OrderList({
  orders,
  tabs,
  activeTab,
}: {
  orders: OrderDetail[];
  tabs: { key: string; label: string; count: number }[];
  activeTab: string;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s+/g, "");
    if (!term) return orders;
    return orders.filter((o) =>
      [o.order_number, o.customer.full_name, o.customer.phone, o.customer.email ?? ""].join("|").toLowerCase().replace(/\s+/g, "").includes(term),
    );
  }, [orders, q]);

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders?status=${t.key}`}
            replace
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === t.key ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand bg-white text-ink-soft"
            }`}
          >
            {t.label} <span className="opacity-60">{t.count}</span>
          </Link>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or order number"
          className="h-11 w-full rounded-full border border-sand bg-white ps-10 pe-4 text-base outline-none focus:border-pine-500 sm:text-sm"
        />
      </div>

      {shown.length === 0 ? (
        <div className="mt-5">
          <Empty title={q ? "No matching orders" : "Nothing here"} body={activeTab === "paid" && !q ? "All orders are packed. Nice work." : undefined} />
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {shown.map((o) => {
            const totalMetres = o.items.reduce((s, i) => s + i.metres, 0);
            return (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 rounded-[1.1rem] border border-sand/80 bg-white/70 p-3.5 transition-colors hover:border-pine-300">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full ${o.fulfilment === "pickup" ? "bg-brass/15 text-[#7a5a26]" : "bg-pine-50 text-pine-700"}`}>
                    {o.fulfilment === "pickup" ? <Store className="size-4.5" /> : <Truck className="size-4.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-ink">{o.customer.full_name}</p>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {o.order_number} · {o.items.length} fabric{o.items.length === 1 ? "" : "s"}, {metres(totalMetres)} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{bhd(o.total_fils)}</span>
                  <ChevronRight className="size-4 shrink-0 text-stone" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
