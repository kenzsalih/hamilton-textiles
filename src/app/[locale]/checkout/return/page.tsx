import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { confirmCharge, type ConfirmResult } from "@/lib/payments/confirm";
import { getRepo } from "@/lib/data";
import { Price } from "@/components/currency/currency-provider";
import { ClearCart } from "@/components/checkout/clear-cart";

export const metadata: Metadata = { robots: { index: false } };

export default async function CheckoutReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tap_id?: string; demo?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("order");
  const { tap_id, demo } = await searchParams;

  let result: ConfirmResult;
  let totalFils: number | null = null;
  const demoOrder = demo && process.env.NODE_ENV !== "production" ? await getRepo().getOrderByNumber(demo) : null;
  if (demoOrder) {
    result = { status: "paid", orderNumber: demoOrder.order_number };
    totalFils = demoOrder.total_fils;
  } else if (tap_id) {
    try {
      result = await confirmCharge(tap_id);
    } catch (err) {
      console.error("Payment confirmation failed", err);
      result = { status: "failed", orderNumber: null, reason: "error" };
    }
  } else {
    result = { status: "failed", orderNumber: null, reason: "missing" };
  }

  const Icon = result.status === "paid" ? CheckCircle2 : result.status === "pending" ? Clock : XCircle;
  const tone = result.status === "paid" ? "text-pine-700 bg-pine-50" : result.status === "pending" ? "text-brass bg-linen" : "text-crimson bg-crimson/10";

  return (
    <div className="container-x flex min-h-[70dvh] items-center justify-center py-20">
      {result.status === "paid" && <ClearCart />}
      <div className="w-full max-w-lg text-center">
        <span className={`mx-auto grid size-20 animate-rise place-items-center rounded-full ${tone}`}>
          <Icon className="size-10" strokeWidth={1.4} />
        </span>
        <h1 className="mt-8 animate-rise font-display text-5xl text-pine-900 [animation-delay:80ms]">{t(`${result.status}.title`)}</h1>
        <p className="mt-4 animate-rise leading-relaxed text-ink-soft [animation-delay:160ms]">{t(`${result.status}.body`)}</p>

        {result.orderNumber && (
          <div className="mx-auto mt-8 max-w-xs animate-rise rounded-2xl border border-sand bg-white/60 p-5 [animation-delay:240ms]">
            <p className="text-xs text-muted">{t("orderNumber")}</p>
            <p className="mt-1 font-display text-3xl tracking-wide text-pine-900" dir="ltr">{result.orderNumber}</p>
            {totalFils !== null && (
              <p className="mt-2 text-sm text-ink-soft">
                <Price fils={totalFils} />
              </p>
            )}
          </div>
        )}
        {demoOrder && <p className="mt-4 text-xs text-brass">{t("demoNote")}</p>}

        <div className="mt-10 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:320ms]">
          {result.status === "failed" ? (
            <Link href="/checkout" className="btn btn-primary">{t("tryAgain")}</Link>
          ) : (
            <Link href="/track" className="btn btn-primary">{t("trackOrder")}</Link>
          )}
          <Link href="/shop" className="btn btn-ghost text-pine-900">{t("keepShopping")}</Link>
        </div>
      </div>
    </div>
  );
}
