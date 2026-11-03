import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getMaterials } from "@/lib/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { ShopBrowser } from "@/components/shop/shop-browser";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "offers" });
  return { title: t("title"), description: t("intro") };
}

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, nav, materials, categories] = await Promise.all([
    getTranslations("offers"),
    getTranslations("nav"),
    getMaterials(),
    getCategories(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("intro")}
        crumbs={[{ href: "/", label: nav("home") }, { href: "/offers", label: nav("offers") }]}
      />
      <Suspense>
        <ShopBrowser materials={materials} categories={categories} onSale />
      </Suspense>
    </>
  );
}
