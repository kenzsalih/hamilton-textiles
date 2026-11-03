import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getCategoryBySlug, getMaterials, localised } from "@/lib/catalog";
import { seedCategories } from "@/lib/catalog/seed";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/layout/page-header";
import { ShopBrowser } from "@/components/shop/shop-browser";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => seedCategories.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: localised(category, "name", locale), description: localised(category, "description", locale) };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [t, nav, materials, categories] = await Promise.all([
    getTranslations("collections"),
    getTranslations("nav"),
    getMaterials(),
    getCategories(),
  ]);
  const name = localised(category, "name", locale);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={name}
        description={localised(category, "description", locale)}
        crumbs={[
          { href: "/", label: nav("home") },
          { href: "/collections", label: nav("collections") },
          { href: `/collections/${slug}`, label: name },
        ]}
      />
      <Suspense>
        <ShopBrowser materials={materials} categories={categories} lockedCategory={slug} />
      </Suspense>
    </>
  );
}
