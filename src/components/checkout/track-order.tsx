"use client";

import { useState, useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Check, Loader2, Search } from "lucide-react";
import { trackOrder, type TrackedOrder } from "@/app/[locale]/checkout/actions";
import { Price } from "@/components/currency/currency-provider";

const DELIVERY_STEPS = ["paid", "packed", "shipped", "delivered"] as const;
const PICKUP_STEPS = ["paid", "packed", "ready_for_pickup", "delivered"] as const;

export function TrackOrderForm() {
  const t = useTranslations("track");
  const locale = useLocale();
  const format = useFormatter();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (form: FormData) => {
    setError(null);
    start(async () => {
      const res = await trackOrder({ orderNumber: form.get("orderNumber"), phone: form.get("phone") });
      if (res.ok) setOrder(res.order);
      else {
        setOrder(null);
        setError(t(`errors.${res.error}`));
      }
    });
  };

  const steps = order?.fulfilment === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const reached = new Map(order?.events.map((e) => [e.status, e.at]));
  const currentIndex = order ? Math.max(...steps.map((s, i) => (reached.has(s) || order.status === s ? i : -1))) : -1;
  const stopped = order && ["cancelled", "refunded", "pending_payment"].includes(order.status);

  return (
    <div className="container-x grid gap-10 py-14 pb-24 lg:grid-cols-[24rem_1fr] lg:gap-16">
      <form action={submit} className="space-y-4 self-start rounded-[1.5rem] bg-linen p-6">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t("orderNumber")}</span>
          <input
            name="orderNumber"
            required
            placeholder="HT-1001"
            dir="ltr"
            className="mt-1.5 h-12 w-full rounded-xl border border-sand bg-ivory px-4 text-sm uppercase outline-none focus:border-pine-500"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t("phone")}</span>
          <input
            name="phone"
            type="tel"
            required
            dir="ltr"
            className="mt-1.5 h-12 w-full rounded-xl border border-sand bg-ivory px-4 text-sm outline-none focus:border-pine-500"
          />
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {t("find")}
        </button>
        {error && <p role="alert" className="text-sm text-crimson">{error}</p>}
      </form>

      <div>
        {!order ? (
          <div className="grid h-full min-h-60 place-items-center rounded-[1.5rem] border border-dashed border-sand p-10 text-center text-sm text-muted">
            {t("placeholder")}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-4xl text-pine-900" dir="ltr">{order.orderNumber}</h2>
              <p className="text-sm text-muted">
                {format.dateTime(new Date(order.createdAt), { dateStyle: "medium" })} · <Price fils={order.totalFils} />
              </p>
            </div>

            {stopped ? (
              <p className="mt-8 rounded-2xl bg-crimson/10 px-5 py-4 text-sm font-medium text-crimson">{t(`status.${order.status}`)}</p>
            ) : (
              <ol className="mt-10 space-y-0">
                {steps.map((step, i) => {
                  const done = i <= currentIndex;
                  const at = reached.get(step);
                  return (
                    <li key={step} className="relative flex gap-5 pb-9 last:pb-0">
                      {i < steps.length - 1 && (
                        <span className={`absolute start-[0.9375rem] top-8 h-[calc(100%-2rem)] w-px ${i < currentIndex ? "bg-pine-700" : "bg-sand"}`} />
                      )}
                      <span
                        className={`relative grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          done ? "border-pine-700 bg-pine-700 text-ivory" : "border-sand bg-ivory text-transparent"
                        }`}
                      >
                        <Check className="size-4" strokeWidth={2.5} />
                      </span>
                      <div className="pt-1">
                        <p className={`font-semibold ${done ? "text-ink" : "text-muted"}`}>{t(`status.${step}`)}</p>
                        {at && <p className="text-xs text-muted">{format.dateTime(new Date(at), { dateStyle: "medium", timeStyle: "short" })}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <ul className="mt-10 divide-y divide-sand border-y border-sand text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between py-3">
                  <span>{locale === "ar" ? item.name_ar : item.name_en}</span>
                  <span className="text-muted" dir="ltr">{item.metres} m</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
