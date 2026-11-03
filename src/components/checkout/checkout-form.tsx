"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Lock, MapPin, Store, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { Price, useCurrency } from "@/components/currency/currency-provider";
import { FabricSwatch } from "@/components/fabric/fabric-swatch";
import { COUNTRIES, SHIPPING_RATES, zoneFor } from "@/lib/shipping";
import { DIAL_CODES, countryName } from "@/lib/countries";
import { lineTotal } from "@/lib/metres";
import { placeOrder, quoteOrder, type QuoteSummary } from "@/app/[locale]/checkout/actions";

type Country = (typeof COUNTRIES)[number];
type Fulfilment = "delivery" | "pickup";

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { currency } = useCurrency();
  const { lines, ready, subtotalFils, clear } = useCart();

  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [country, setCountry] = useState<Country>("BH");
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | undefined>();
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [quoting, startQuote] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  const items = useMemo(() => lines.map((l) => ({ materialId: l.materialId, metres: l.metres })), [lines]);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    const id = setTimeout(() => {
      startQuote(async () => setQuote(await quoteOrder({ items, promoCode, fulfilment, country })));
    }, 250);
    return () => clearTimeout(id);
  }, [ready, items, promoCode, fulfilment, country]);

  if (!ready) return <div className="container-x py-32" />;

  if (lines.length === 0) {
    return (
      <div className="container-x py-32 text-center">
        <p className="font-display text-4xl text-pine-900">{t("emptyTitle")}</p>
        <p className="mt-3 text-muted">{t("emptyBody")}</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          {t("backToShop")}
        </Link>
      </div>
    );
  }

  const problems = new Map((quote?.problems ?? []).map((p) => [p.materialId, p]));

  const submit = (form: FormData) => {
    setError(null);
    setInvalid(new Set());
    const field = (k: string) => (form.get(k) as string | null)?.trim() || undefined;

    startSubmit(async () => {
      const result = await placeOrder({
        items,
        promoCode,
        fulfilment,
        country,
        fullName: field("fullName") ?? "",
        email: field("email") ?? "",
        phone: field("phone") ?? "",
        address:
          fulfilment === "delivery"
            ? {
                area: field("area"),
                block: field("block"),
                road: field("road"),
                building: field("building"),
                flat: field("flat"),
                line1: field("line1"),
                line2: field("line2"),
                city: field("city"),
                postcode: field("postcode"),
              }
            : undefined,
        note: field("note"),
        locale: locale as "en" | "ar",
        displayCurrency: currency,
        website: field("website") ?? "",
      });

      if (result.ok) {
        if (result.redirectUrl.startsWith("/")) clear();
        window.location.assign(result.redirectUrl);
        return;
      }
      if (result.error === "validation") {
        const fields = new Set(result.fields.map((f) => f.replace(/^address\./, "")));
        setInvalid(fields);
        setError(t("errors.validation"));
        formRef.current?.querySelector<HTMLElement>(`[name="${[...fields][0]}"]`)?.focus();
      } else if (result.error === "cart") {
        setError(t("errors.cart"));
      } else if (result.error === "promo") {
        setError(t("errors.promo"));
      } else {
        setError(t(`errors.${result.error}`));
      }
    });
  };

  const input = (name: string, opts: { label: string; type?: string; autoComplete?: string; optional?: boolean; dir?: "ltr"; className?: string }) => (
    <label className={`block ${opts.className ?? ""}`}>
      <span className="text-xs font-semibold text-ink-soft">
        {opts.label}
        {opts.optional && <span className="font-normal text-muted"> ({t("optional")})</span>}
      </span>
      <input
        name={name}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        required={!opts.optional}
        dir={opts.dir}
        aria-invalid={invalid.has(name)}
        className={`mt-1.5 h-12 w-full rounded-xl border bg-white/70 px-4 text-sm outline-none transition-colors focus:border-pine-500 ${
          invalid.has(name) ? "border-crimson" : "border-sand"
        }`}
      />
    </label>
  );

  const rate = SHIPPING_RATES[zoneFor(country)];

  return (
    <form ref={formRef} action={submit} className="container-x grid gap-10 pt-8 pb-24 lg:grid-cols-[1fr_26rem] lg:gap-14">
      <div className="space-y-10">
        {/* Contact */}
        <section>
          <h2 className="font-display text-3xl text-pine-900">{t("contact")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {input("fullName", { label: t("fullName"), autoComplete: "name", className: "sm:col-span-2" })}
            {input("email", { label: t("email"), type: "email", autoComplete: "email", dir: "ltr" })}
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{t("phone")}</span>
              <div className={`mt-1.5 flex h-12 overflow-hidden rounded-xl border bg-white/70 focus-within:border-pine-500 ${invalid.has("phone") ? "border-crimson" : "border-sand"}`} dir="ltr">
                <span className="grid place-items-center border-e border-sand bg-linen px-3 text-sm text-muted">+{DIAL_CODES[country]}</span>
                <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
              </div>
            </label>
          </div>
          {/* Honeypot */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        </section>

        {/* Fulfilment */}
        <section>
          <h2 className="font-display text-3xl text-pine-900">{t("delivery")}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup">
            {(["delivery", "pickup"] as const).map((f) => {
              const Icon = f === "delivery" ? Truck : Store;
              const on = fulfilment === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFulfilment(f)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition-colors duration-300 ${
                    on ? "border-pine-800 bg-pine-50" : "border-sand hover:border-pine-300"
                  }`}
                >
                  <Icon className={`mt-0.5 size-5 shrink-0 ${on ? "text-pine-800" : "text-muted"}`} strokeWidth={1.5} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{t(`fulfilment.${f}`)}</span>
                    <span className="mt-0.5 block text-xs text-muted">{t(`fulfilment.${f}Hint`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {fulfilment === "delivery" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink-soft">{t("country")}</span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className="mt-1.5 h-12 w-full rounded-xl border border-sand bg-white/70 px-4 text-sm outline-none focus:border-pine-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {countryName(c, locale)}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-muted">{t("deliveryTime", { days: rate.days })}</span>
              </label>
              {country === "BH" ? (
                <>
                  {input("area", { label: t("address.area"), autoComplete: "address-level2", className: "sm:col-span-2" })}
                  {input("block", { label: t("address.block"), dir: "ltr" })}
                  {input("road", { label: t("address.road"), dir: "ltr" })}
                  {input("building", { label: t("address.building"), dir: "ltr" })}
                  {input("flat", { label: t("address.flat"), optional: true, dir: "ltr" })}
                </>
              ) : (
                <>
                  {input("line1", { label: t("address.line1"), autoComplete: "address-line1", className: "sm:col-span-2" })}
                  {input("line2", { label: t("address.line2"), autoComplete: "address-line2", optional: true, className: "sm:col-span-2" })}
                  {input("city", { label: t("address.city"), autoComplete: "address-level2" })}
                  {input("postcode", { label: t("address.postcode"), autoComplete: "postal-code", optional: true, dir: "ltr" })}
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 flex gap-3 rounded-2xl bg-linen p-5 text-sm text-ink-soft">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brass" />
              <div>
                <p className="font-semibold text-ink">{t("pickupFrom")}</p>
                <p className="mt-1">{t("pickupAddress")}</p>
                <p className="mt-1 text-xs text-muted">{t("pickupNote")}</p>
              </div>
            </div>
          )}

          <label className="mt-6 block">
            <span className="text-xs font-semibold text-ink-soft">
              {t("note")} <span className="font-normal text-muted">({t("optional")})</span>
            </span>
            <textarea
              name="note"
              rows={3}
              maxLength={500}
              placeholder={t("notePlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/70 px-4 py-3 text-sm outline-none focus:border-pine-500"
            />
          </label>
        </section>

        {/* Payment */}
        <section>
          <h2 className="font-display text-3xl text-pine-900">{t("payment")}</h2>
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-sand p-5">
            <Lock className="size-5 shrink-0 text-pine-700" strokeWidth={1.5} />
            <div className="flex-1 text-sm text-ink-soft">{t("paymentNote")}</div>
            <div className="hidden gap-1.5 sm:flex" dir="ltr">
              {["BenefitPay", "VISA", "Mastercard"].map((p) => (
                <span key={p} className="rounded-md border border-sand px-2 py-1 text-[0.6rem] font-bold tracking-wide text-ink-soft">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[1.5rem] bg-linen p-6">
          <h2 className="font-display text-2xl text-pine-900">{t("summary")}</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((l) => {
              const problem = problems.get(l.materialId);
              const name = locale === "ar" ? l.name_ar : l.name_en;
              return (
                <li key={l.materialId} className="flex gap-3">
                  <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {l.image ? (
                      <Image src={l.image} alt={name} fill sizes="52px" className="object-cover" />
                    ) : (
                      <FabricSwatch hex={l.colour_hex ?? "#d8cfc0"} pattern={l.pattern} drape={false} className="size-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{name}</p>
                    <p className="text-xs text-muted">
                      <span dir="ltr">{l.metres} m</span> × <Price fils={l.price_fils} />
                    </p>
                    {problem && (
                      <p className="mt-1 text-xs font-medium text-crimson">
                        {problem.reason === "stock" ? t("problems.stock", { metres: problem.available ?? 0 }) : t(`problems.${problem.reason}`)}
                      </p>
                    )}
                  </div>
                  <Price fils={lineTotal(l.price_fils, l.metres)} className="text-sm font-semibold text-ink" />
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex gap-2 border-t border-sand pt-5">
            <input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setPromoCode(promoInput || undefined);
                }
              }}
              placeholder={t("promoPlaceholder")}
              aria-label={t("promoPlaceholder")}
              dir="ltr"
              className="h-11 min-w-0 flex-1 rounded-full border border-sand bg-ivory px-4 text-sm tracking-wider uppercase outline-none focus:border-pine-500"
            />
            <button type="button" onClick={() => setPromoCode(promoInput || undefined)} className="btn btn-ghost h-11 px-5 text-pine-900">
              {t("apply")}
            </button>
          </div>
          {quote?.promoStatus && promoCode && (
            <p className={`mt-2 text-xs font-medium ${quote.promoStatus === "applied" ? "text-pine-700" : "text-crimson"}`}>
              {t(`promo.${quote.promoStatus}`, { code: promoCode })}
            </p>
          )}

          <dl className={`mt-5 space-y-2.5 text-sm transition-opacity ${quoting ? "opacity-60" : ""}`}>
            <Row label={t("subtotal")}><Price fils={quote?.subtotalFils ?? subtotalFils} /></Row>
            {quote && quote.discountFils > 0 && (
              <Row label={t("discount")} className="text-pine-700">−<Price fils={quote.discountFils} /></Row>
            )}
            <Row label={fulfilment === "pickup" ? t("fulfilment.pickup") : t("shipping")}>
              {quote ? quote.shippingFils === 0 ? <span className="font-semibold text-pine-700">{t("free")}</span> : <Price fils={quote.shippingFils} /> : "—"}
            </Row>
            {quote && quote.vatFils > 0 && <Row label={t("vat")}><Price fils={quote.vatFils} /></Row>}
            <div className="flex items-baseline justify-between border-t border-sand pt-4">
              <dt className="font-semibold text-ink">{t("total")}</dt>
              <dd className="flex items-center gap-2">
                {quoting && <Loader2 className="size-3.5 animate-spin text-muted" />}
                <Price fils={quote?.totalFils ?? subtotalFils} className="font-display text-3xl text-pine-900" />
              </dd>
            </div>
          </dl>
          {currency !== "BHD" && <p className="mt-2 text-xs text-muted">{t("chargedInBhd")}</p>}

          {error && <p role="alert" className="mt-5 rounded-xl bg-crimson/10 px-4 py-3 text-sm text-crimson">{error}</p>}

          <button type="submit" disabled={submitting || problems.size > 0} className="btn btn-primary mt-6 h-14 w-full text-base disabled:opacity-60">
            {submitting ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-4" />}
            {submitting ? t("processing") : t("pay")}
          </button>
          <p className="mt-3 text-center text-xs text-muted">{t("terms")}</p>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between ${className ?? ""}`}>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
