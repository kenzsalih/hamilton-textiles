import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getMaterials } from "@/lib/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { ShopBrowser } from "@/components/shop/shop-browser";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: t("title"), description: t("intro") };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, materials, categories] = await Promise.all([getTranslations("shop"), getMaterials(), getCategories()]);

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />
      <Suspense>
        <ShopBrowser materials={materials} categories={categories} />
      </Suspense>
    </>
  );
}
