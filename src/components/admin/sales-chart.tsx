"use client";

import { useState } from "react";
import { bhd } from "@/lib/admin/format";

/** Daily revenue bars. Tap or hover a bar to read its value. */
export function SalesChart({ series }: { series: { day: string; revenue: number; orders: number }[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const shown = selected !== null ? series[selected] : null;
  const label = (day: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

  return (
    <div>
      <div className="flex h-6 items-baseline justify-between px-4 text-xs sm:px-5">
        {shown ? (
          <>
            <span className="text-muted">{label(shown.day)}</span>
            <span className="font-semibold text-ink">
              {bhd(shown.revenue)} · {shown.orders} order{shown.orders === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <span className="text-muted">Tap a bar for details</span>
        )}
      </div>
      <div className="flex h-36 items-end gap-[3px] px-4 pt-2 sm:px-5" onMouseLeave={() => setSelected(null)}>
        {series.map((d, i) => (
          <button
            key={d.day}
            type="button"
            onMouseEnter={() => setSelected(i)}
            onClick={() => setSelected(selected === i ? null : i)}
            aria-label={`${label(d.day)}: ${bhd(d.revenue)}`}
            className="group flex h-full flex-1 items-end"
          >
            <span
              className={`w-full rounded-t-[3px] transition-colors ${
                selected === i ? "bg-brass" : i === series.length - 1 ? "bg-pine-700" : "bg-pine-300/70 group-hover:bg-pine-500"
              }`}
              style={{ height: `${Math.max(d.revenue ? 4 : 1.5, (d.revenue / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between px-4 pt-1.5 pb-4 text-[0.65rem] text-muted sm:px-5">
        <span>{label(series[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
