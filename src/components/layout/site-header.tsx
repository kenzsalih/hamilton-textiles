"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { CurrencySelect, LanguageToggle } from "./preferences";
import { CartButton } from "@/components/cart/cart-drawer";

const NAV = [
  { href: "/shop", key: "shop" },
  { href: "/collections", key: "collections" },
  { href: "/shop?sort=new", key: "newArrivals" },
  { href: "/offers", key: "offers" },
  { href: "/#visit", key: "visit" },
] as const;

export function SiteHeader() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <div className="bg-pine-900 text-pine-100">
        <p className="container-x py-2 text-center text-[0.72rem] font-medium tracking-wide">{t("announcement")}</p>
      </div>

      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled ? "bg-ivory/85 shadow-[0_1px_0_var(--color-sand)] backdrop-blur-xl" : "bg-ivory"
        }`}
      >
        <div className="container-x flex h-18 items-center justify-between gap-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-ms-2 p-2 lg:hidden"
            aria-label={t("nav.menu")}
          >
            <Menu className="size-5" strokeWidth={1.6} />
          </button>

          <Link href="/" className="shrink-0" aria-label={`${t("brand.name")} ${t("brand.sub")}`}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="group relative py-2 text-[0.85rem] font-medium text-ink-soft transition-colors hover:text-pine-900"
              >
                {t(`nav.${item.key}`)}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-brass transition-transform duration-500 ease-[var(--ease-silk)] group-hover:scale-x-100 rtl:origin-right" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="hidden items-center gap-5 text-ink-soft sm:flex">
              <LanguageToggle />
              <span className="h-4 w-px bg-sand" />
              <CurrencySelect />
            </div>
            <Link href="/shop" aria-label={t("nav.search")} className="p-1 text-ink-soft hover:text-pine-900">
              <Search className="size-5" strokeWidth={1.6} />
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-pine-900/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 start-0 flex w-[min(22rem,88vw)] flex-col bg-ivory p-6 shadow-2xl transition-transform duration-500 ease-[var(--ease-silk)] ${
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button type="button" onClick={() => setOpen(false)} className="-me-2 p-2" aria-label={t("nav.close")}>
              <X className="size-5" strokeWidth={1.6} />
            </button>
          </div>
          <nav className="mt-10 flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-sand py-4 font-display text-2xl text-pine-900"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex items-center justify-between rounded-xl bg-linen px-5 py-4 text-ink-soft">
            <LanguageToggle />
            <CurrencySelect />
          </div>
        </div>
      </div>
    </>
  );
}
