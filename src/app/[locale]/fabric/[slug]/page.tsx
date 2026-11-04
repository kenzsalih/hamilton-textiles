import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getMaterialBySlug, getRelatedMaterials, localised } from "@/lib/catalog";
import { seedMaterials } from "@/lib/catalog/seed";
import { SITE_URL } from "@/lib/site";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { FabricGallery } from "@/components/fabric/fabric-gallery";
import { PurchasePanel } from "@/components/fabric/purchase-panel";
import { ProductCard } from "@/components/fabric/product-card";
import { ChevronRight, Truck, Scissors, RotateCcw } from "lucide-react";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => seedMaterials.map((m) => ({ locale, slug: m.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const material = await getMaterialBySlug(slug);
  if (!material) return {};
  const name = localised(material, "name", locale);
  return {
    title: `${name} — ${localised(material, "colour_name", locale)}`,
    description: localised(material, "description", locale),
    openGraph: material.images[0] ? { images: [material.images[0].url] } : undefined,
  };
}

export default async function FabricPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const material = await getMaterialBySlug(slug);
  if (!material) notFound();

  const [t, nav, categories, related] = await Promise.all([
    getTranslations("fabric"),
    getTranslations("nav"),
    getCategories(),
    getRelatedMaterials(material),
  ]);
  const category = categories.find((c) => c.id === material.category_id);
  const name = localised(material, "name", locale);
  const colour = localised(material, "colour_name", locale);

  const specs = [
    { label: t("specs.composition"), value: material.composition },
    { label: t("specs.width"), value: material.width_cm ? `${material.width_cm} cm` : null },
    { label: t("specs.weight"), value: material.weight_gsm ? `${material.weight_gsm} g/m²` : null },
    { label: t("specs.colour"), value: colour },
    { label: t("specs.sku"), value: material.sku },
  ].filter((s) => s.value);

  const site = SITE_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: material.sku,
    description: localised(material, "description", locale),
    image: material.images.map((i) => i.url),
    brand: { "@type": "Brand", name: "Hamilton Textiles" },
    offers: {
      "@type": "Offer",
      url: `${site}/${locale}/fabric/${material.slug}`,
      priceCurrency: "BHD",
      price: (material.price_fils / 1000).toFixed(3),
      unitCode: "MTR",
      availability: material.stock_m > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="container-x pt-6 pb-20 lg:pt-10">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <li><Link href="/" className="hover:text-pine-900">{nav("home")}</Link></li>
            <li aria-hidden="true"><ChevronRight className="size-3 rtl:-scale-x-100" /></li>
            <li><Link href="/shop" className="hover:text-pine-900">{nav("shop")}</Link></li>
            {category && (
              <>
                <li aria-hidden="true"><ChevronRight className="size-3 rtl:-scale-x-100" /></li>
                <li>
                  <Link href={`/collections/${category.slug}`} className="hover:text-pine-900">
                    {localised(category, "name", locale)}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true"><ChevronRight className="size-3 rtl:-scale-x-100" /></li>
            <li className="text-ink-soft" aria-current="page">{name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <FabricGallery
              name={name}
              images={material.images.map((i) => ({ url: i.url, alt: localised(i, "alt", locale) }))}
              hex={material.colour_hex ?? "#d8cfc0"}
              pattern={material.pattern}
            />
          </div>

          <div>
            {category && <p className="eyebrow">{localised(category, "name", locale)}</p>}
            <h1 className="mt-3 font-display text-5xl leading-tight text-pine-900 sm:text-6xl">{name}</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: material.colour_hex ?? undefined }} />
              {colour}
            </p>

            <div className="mt-8">
              <PurchasePanel material={material} />
            </div>

            <p className="mt-10 leading-relaxed text-ink-soft">{localised(material, "description", locale)}</p>

            <dl className="mt-8 divide-y divide-sand border-y border-sand">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-6 py-3.5 text-sm">
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="text-end font-medium text-ink" dir="auto">{s.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3"><Scissors className="size-4 shrink-0 text-brass" />{t("perks.cut")}</li>
              <li className="flex gap-3"><Truck className="size-4 shrink-0 text-brass" />{t("perks.delivery")}</li>
              <li className="flex gap-3"><RotateCcw className="size-4 shrink-0 text-brass" />{t("perks.returns")}</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-sand bg-linen/50">
          <div className="container-x py-16 lg:py-20">
            <h2 className="font-display text-4xl text-pine-900">{t("related")}</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map((m) => (
                <ProductCard key={m.id} material={m} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
