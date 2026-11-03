import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogueStats } from "@/lib/catalog";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryGrid } from "@/components/home/category-grid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "collections" });
  return { title: t("title"), description: t("intro") };
}

export default async function CollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, nav, stats] = await Promise.all([getTranslations("collections"), getTranslations("nav"), getCatalogueStats()]);

  return (
    <>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("intro")}
        crumbs={[{ href: "/", label: nav("home") }, { href: "/collections", label: nav("collections") }]}
      />
      <CategoryGrid categories={stats.categories} showHeading={false} />
    </>
  );
}
