import { getTranslations } from "next-intl/server";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Price } from "@/components/currency/currency-provider";
import { PageHeader } from "@/components/layout/page-header";
import { SHIPPING_RATES, type ShippingZone } from "@/lib/shipping";

type Kind = "shipping" | "returns" | "faq";
type Section = { h: string; p: string };
type Qa = { q: string; a: string };

export async function PolicyPage({ kind }: { kind: Kind }) {
  const [t, nav, footer] = await Promise.all([getTranslations("policies"), getTranslations("nav"), getTranslations("footer")]);
  const crumbLabel = footer(kind);

  return (
    <>
      <PageHeader
        eyebrow={t(`${kind}.eyebrow`)}
        title={t(`${kind}.title`)}
        description={t(`${kind}.intro`)}
        crumbs={[{ href: "/", label: nav("home") }, { href: `/${kind}`, label: crumbLabel }]}
      />
      <div className="container-x grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:py-20">
        <div className="max-w-2xl">
          {kind === "shipping" && <RatesTable />}
          {kind === "faq" ? <Faq items={t.raw("faq.items") as Qa[]} /> : <Sections items={t.raw(`${kind}.sections`) as Section[]} />}
        </div>
        <aside className="lg:pt-2">
          <div className="rounded-[1.5rem] bg-pine-900 p-6 text-ivory lg:sticky lg:top-28">
            <p className="font-display text-2xl">{t("questions")}</p>
            <p className="mt-2 text-sm leading-relaxed text-pine-100/80">{t("questionsBody")}</p>
            <a href="https://wa.me/97338257064" target="_blank" rel="noopener" className="btn mt-5 w-full bg-ivory text-pine-900 hover:bg-linen">
              <MessageCircle className="size-4" />
              {t("whatsapp")}
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

function Sections({ items }: { items: Section[] }) {
  return (
    <div className="space-y-10">
      {items.map((s, i) => (
        <section key={s.h} className="grid gap-3 sm:grid-cols-[3rem_1fr]">
          <span className="font-display text-2xl text-brass" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h2 className="font-display text-3xl text-pine-900">{s.h}</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{s.p}</p>
          </div>
        </section>
      ))}
    </div>
  );
}

function Faq({ items }: { items: Qa[] }) {
  return (
    <div className="divide-y divide-sand border-y border-sand">
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-2xl text-pine-900 [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown className="size-5 shrink-0 text-brass transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-6 leading-relaxed text-ink-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

async function RatesTable() {
  const t = await getTranslations("policies.shipping");
  const zones = Object.keys(SHIPPING_RATES) as ShippingZone[];
  return (
    <div className="mb-14 overflow-hidden rounded-[1.5rem] border border-sand bg-white/60">
      <table className="w-full text-start text-sm">
        <thead className="bg-linen text-xs tracking-wider text-muted uppercase">
          <tr>
            <th className="px-5 py-3 text-start font-semibold">{t("tableZone")}</th>
            <th className="px-5 py-3 text-start font-semibold">{t("tableFee")}</th>
            <th className="hidden px-5 py-3 text-start font-semibold sm:table-cell">{t("tableTime")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand/70">
          {zones.map((z) => {
            const r = SHIPPING_RATES[z];
            return (
              <tr key={z}>
                <td className="px-5 py-4 font-medium text-pine-900">
                  {t(`zones.${z}`)}
                  <span className="mt-0.5 block text-xs font-normal text-muted sm:hidden">{t("days", { days: r.days })}</span>
                </td>
                <td className="px-5 py-4">
                  <Price fils={r.feeFils} />
                  {r.freeOverFils !== null && (
                    <span className="mt-0.5 block text-xs text-pine-700">
                      {t.rich("tableFree", { amount: () => <Price fils={r.freeOverFils!} /> })}
                    </span>
                  )}
                </td>
                <td className="hidden px-5 py-4 text-ink-soft sm:table-cell">{t("days", { days: r.days })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
