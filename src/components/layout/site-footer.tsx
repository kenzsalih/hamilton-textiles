import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("footer.shop"),
      links: [
        { href: "/shop", label: t("nav.shop") },
        { href: "/collections", label: t("nav.collections") },
        { href: "/shop?sort=new", label: t("nav.newArrivals") },
        { href: "/offers", label: t("nav.offers") },
      ],
    },
    {
      title: t("footer.help"),
      links: [
        { href: "/track", label: t("nav.track") },
        { href: "/shipping", label: t("footer.shipping") },
        { href: "/returns", label: t("footer.returns") },
        { href: "/faq", label: t("footer.faq") },
        { href: "/#visit", label: t("footer.contact") },
      ],
    },
  ];

  return (
    <footer className="grain bg-pine-900 text-pine-100">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-pine-300">{t("footer.tagline")}</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow !text-brass-light">{col.title}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-pine-100/80 transition-colors hover:text-ivory">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="eyebrow !text-brass-light">{t("visit.eyebrow")}</h3>
          <p className="mt-5 text-sm leading-relaxed text-pine-100/80">{t("visit.address")}</p>
          <a
            href="https://wa.me/97338257064"
            className="mt-3 inline-block text-sm text-ivory underline decoration-brass/60 underline-offset-4 hover:decoration-brass"
            dir="ltr"
          >
            +973 3825 7064
          </a>
          <p className="mt-8 text-xs text-pine-300">{t("footer.payments")}</p>
          <div className="mt-3 flex gap-2" dir="ltr">
            {["BenefitPay", "VISA", "Mastercard"].map((p) => (
              <span key={p} className="rounded-md border border-pine-100/20 px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-pine-100/90">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-pine-100/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-pine-300 sm:flex-row sm:justify-between">
          <p>
            © {year} {t("brand.legal")}. {t("footer.rights")}
          </p>
          <p>{t("footer.cr")}</p>
        </div>
      </div>
    </footer>
  );
}
