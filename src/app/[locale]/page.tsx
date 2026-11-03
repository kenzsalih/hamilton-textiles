import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogueStats, getFeaturedMaterials } from "@/lib/catalog";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { MetreCalculator } from "@/components/home/metre-calculator";
import { HamiltonPromise, Visit } from "@/components/home/promise-and-visit";
import { ProductCard } from "@/components/fabric/product-card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [stats, featured, t] = await Promise.all([
    getCatalogueStats(),
    getFeaturedMaterials(8),
    getTranslations("featured"),
  ]);

  return (
    <>
      <Hero inStockCount={stats.inStockCount} lowestPriceFils={stats.lowestPriceFils} />
      <CategoryGrid categories={stats.categories} />

      <section className="container-x pb-20 lg:pb-28">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-3 font-display text-4xl text-pine-900 sm:text-5xl">{t("title")}</h2>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {featured.map((m, i) => (
            <ProductCard key={m.id} material={m} priority={i < 4} />
          ))}
        </div>
      </section>

      <MetreCalculator />
      <HamiltonPromise />
      <Visit />
    </>
  );
}
