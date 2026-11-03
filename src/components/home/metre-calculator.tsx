"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Lengths for a 150 cm wide fabric: base metres at 160 cm height, plus metres
// per extra 10 cm of height. Rounded up to the nearest half metre.
const GARMENTS = {
  abaya: { base: 3, perTen: 0.25, category: "abaya" },
  thobe: { base: 3.25, perTen: 0.25, category: "thobe" },
  jalabiya: { base: 2.75, perTen: 0.2, category: "cotton" },
  dress: { base: 3, perTen: 0.25, category: "silk" },
  shirt: { base: 1.75, perTen: 0.1, category: "cotton" },
} as const;

type Garment = keyof typeof GARMENTS;

export function MetreCalculator() {
  const t = useTranslations("calculator");
  const [garment, setGarment] = useState<Garment>("abaya");
  const [height, setHeight] = useState(165);

  const g = GARMENTS[garment];
  const metres = Math.ceil((g.base + ((height - 160) / 10) * g.perTen) * 2) / 2;

  return (
    <section id="calculator" className="scroll-mt-20 bg-pine-800 text-ivory">
      <div className="container-x grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="eyebrow !text-brass-light">{t("eyebrow")}</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-5 max-w-md leading-relaxed text-pine-100/80">{t("body")}</p>
        </div>

        <div className="rounded-[1.5rem] bg-ivory p-6 text-ink shadow-2xl sm:p-8">
          <p className="text-sm font-semibold text-ink-soft">{t("garment")}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
            {(Object.keys(GARMENTS) as Garment[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={garment === key}
                onClick={() => setGarment(key)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                  garment === key ? "border-pine-800 bg-pine-800 text-ivory" : "border-sand hover:border-pine-500"
                }`}
              >
                {t(`garments.${key}`)}
              </button>
            ))}
          </div>

          <label className="mt-8 block">
            <span className="flex items-baseline justify-between text-sm font-semibold text-ink-soft">
              {t("height")}
              <span className="font-display text-2xl text-pine-900" dir="ltr">{height}</span>
            </span>
            <input
              type="range"
              min={120}
              max={200}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="mt-3 w-full accent-pine-800"
            />
          </label>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-sand pt-6">
            <div>
              <p className="text-sm text-muted">{t("result")}</p>
              <p className="font-display text-5xl text-pine-900">
                <span dir="ltr">{metres.toFixed(1)}</span> <span className="text-2xl">{t("metres")}</span>
              </p>
            </div>
            <Link href={`/collections/${g.category}`} className="btn btn-primary">
              {t("browse")}
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
