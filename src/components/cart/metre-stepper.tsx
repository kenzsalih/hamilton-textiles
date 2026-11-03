"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { snapMetres } from "@/lib/metres";

export function MetreStepper({
  value,
  onChange,
  min,
  step,
  max,
  size = "md",
}: {
  value: number;
  onChange: (metres: number) => void;
  min: number;
  step: number;
  max: number;
  size?: "sm" | "md";
}) {
  const t = useTranslations("cart");
  const btn = size === "sm" ? "size-8" : "size-11";

  return (
    <div className={`inline-flex items-center rounded-full border border-sand bg-ivory ${size === "sm" ? "text-sm" : ""}`} dir="ltr">
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition-colors hover:bg-linen disabled:opacity-30`}
        onClick={() => onChange(snapMetres(value - step, min, step, max))}
        disabled={value <= min}
        aria-label={t("less")}
      >
        <Minus className="size-3.5" />
      </button>
      <label className="flex items-baseline gap-1 px-1">
        <span className="sr-only">{t("metres")}</span>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0) onChange(snapMetres(n, min, step, max));
          }}
          className={`${size === "sm" ? "w-9" : "w-12"} bg-transparent text-center font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span className="text-xs text-muted">m</span>
      </label>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full transition-colors hover:bg-linen disabled:opacity-30`}
        onClick={() => onChange(snapMetres(value + step, min, step, max))}
        disabled={value + step > max}
        aria-label={t("more")}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
