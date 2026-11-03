import { getTranslations } from "next-intl/server";
import { MapPin, Clock, Ruler, Sparkles, Truck, ShieldCheck } from "lucide-react";

export async function HamiltonPromise() {
  const t = await getTranslations("promise");
  const items = [
    { icon: Ruler, title: t("cut"), body: t("cutBody") },
    { icon: Sparkles, title: t("quality"), body: t("qualityBody") },
    { icon: Truck, title: t("delivery"), body: t("deliveryBody") },
    { icon: ShieldCheck, title: t("secure"), body: t("secureBody") },
  ];

  return (
    <section className="container-x py-20 lg:py-24">
      <h2 className="sr-only">{t("title")}</h2>
      <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-sand bg-sand sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-ivory p-7 lg:p-8">
            <Icon className="size-6 text-brass" strokeWidth={1.4} />
            <h3 className="mt-5 font-display text-2xl text-pine-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function Visit() {
  const t = await getTranslations("visit");

  return (
    <section id="visit" className="scroll-mt-24 pb-20 lg:pb-28">
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[1.75rem] bg-linen lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-3 font-display text-4xl text-pine-900 sm:text-5xl">{t("title")}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">{t("body")}</p>

            <ul className="mt-8 space-y-4 text-sm text-ink-soft">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brass" />
                {t("address")}
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-brass" />
                {t("hours")}
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Hamilton+Textile+Hunainiya+Riffa+Bahrain"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                {t("directions")}
              </a>
              <a href="https://wa.me/97338257064" target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-pine-900">
                {t("whatsapp")}
              </a>
            </div>
          </div>

          <div className="relative min-h-80 lg:min-h-full">
            <iframe
              title={t("address")}
              src="https://www.google.com/maps?q=Hunainiya,+Riffa,+Bahrain&z=15&output=embed"
              className="absolute inset-0 size-full grayscale-[0.6] sepia-[0.15]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
