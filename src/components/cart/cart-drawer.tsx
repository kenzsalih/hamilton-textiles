"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Price } from "@/components/currency/currency-provider";
import { SHIPPING_RATES } from "@/lib/shipping";
import { useCart } from "./cart-provider";
import { CartLineItem, FreeDeliveryProgress } from "./cart-lines";

export function CartDrawer() {
  const t = useTranslations("cart");
  const { lines, subtotalFils, isOpen, close } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const freeOver = SHIPPING_RATES.BH.freeOverFils;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        className={`absolute inset-0 bg-pine-900/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={`absolute inset-y-0 end-0 flex w-[min(28rem,100vw)] flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[var(--ease-silk)] ${
          isOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-sand px-6 py-5">
          <h2 className="font-display text-2xl text-pine-900">
            {t("title")} <span className="text-base text-muted">({lines.length})</span>
          </h2>
          <button type="button" onClick={close} className="-me-2 p-2" aria-label={t("close")}>
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-linen text-brass">
              <ShoppingBag className="size-7" strokeWidth={1.3} />
            </span>
            <p className="font-display text-2xl text-pine-900">{t("empty")}</p>
            <p className="text-sm text-muted">{t("emptyBody")}</p>
            <Link href="/shop" onClick={close} className="btn btn-primary mt-2">
              {t("startShopping")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {freeOver && (
                <div className="pt-5">
                  <FreeDeliveryProgress subtotalFils={subtotalFils} thresholdFils={freeOver} />
                </div>
              )}
              <ul className="divide-y divide-sand">
                {lines.map((line) => (
                  <CartLineItem key={line.materialId} line={line} onNavigate={close} />
                ))}
              </ul>
            </div>
            <footer className="border-t border-sand px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-ink-soft">{t("subtotal")}</span>
                <Price fils={subtotalFils} className="font-display text-2xl text-pine-900" />
              </div>
              <p className="mt-1 text-xs text-muted">{t("taxesNote")}</p>
              <Link href="/checkout" onClick={close} className="btn btn-primary mt-5 w-full">
                {t("checkout")}
              </Link>
              <Link href="/cart" onClick={close} className="mt-3 block text-center text-sm font-semibold text-pine-800 hover:underline">
                {t("viewCart")}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export function CartButton({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { count, open, ready } = useCart();
  return (
    <button type="button" onClick={open} aria-label={t("cart")} className={`relative -me-1 p-1 text-ink-soft hover:text-pine-900 ${className ?? ""}`}>
      <ShoppingBag className="size-5" strokeWidth={1.6} />
      {ready && count > 0 && (
        <span key={count} className="absolute -end-1 -top-1 grid size-4 animate-pop place-items-center rounded-full bg-pine-800 text-[0.6rem] font-bold text-ivory">
          {count}
        </span>
      )}
    </button>
  );
}
