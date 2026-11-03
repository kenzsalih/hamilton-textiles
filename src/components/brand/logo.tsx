import { useTranslations } from "next-intl";

/**
 * Vector redraw of the shopfront emblem: green ring, white field and the
 * red script "Ht" monogram. Replace the paths with the original artwork
 * once the owner supplies a source file.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title ?? "Hamilton Textiles"}>
      <circle cx="50" cy="50" r="49" fill="#1e7a46" />
      <circle cx="50" cy="50" r="41" fill="#ffffff" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#1e7a46" strokeWidth="1" />
      <g fill="none" stroke="#c4262e" strokeLinecap="round" strokeLinejoin="round">
        {/* H — two forward-leaning stems */}
        <path d="M37 26 C36 40 33 56 28 73" strokeWidth="6.5" />
        <path d="M55 24 C54 40 51 57 47 73" strokeWidth="6.5" />
        {/* sweeping crossbar that carries on into the t */}
        <path d="M21 52 C33 46 50 45 63 47 C70 48 76 46 80 43" strokeWidth="4" />
        {/* t */}
        <path d="M70 31 C68 44 65 57 64 66 C63 73 68 75 75 69" strokeWidth="5.5" />
        {/* the small dashes from the original mark */}
        <path d="M62 36 L67 34.5" strokeWidth="2.5" />
        <path d="M24 34 L29 33" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const t = useTranslations("brand");
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <LogoMark className="size-10 shrink-0 drop-shadow-sm sm:size-11" title={`${t("name")} ${t("sub")}`} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.45rem] tracking-[0.08em] uppercase rtl:tracking-normal rtl:normal-case ${
            tone === "light" ? "text-ivory" : "text-pine-900"
          }`}
        >
          {t("name")}
        </span>
        <span
          className={`mt-1 text-[0.6rem] font-semibold tracking-[0.42em] uppercase rtl:tracking-normal rtl:text-[0.7rem] ${
            tone === "light" ? "text-brass-light" : "text-brass"
          }`}
        >
          {t("sub")}
        </span>
      </span>
    </span>
  );
}
