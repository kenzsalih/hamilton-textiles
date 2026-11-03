import { useTranslations } from "next-intl";
import { LogoMark } from "./logo-mark";

export { LogoMark };

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
