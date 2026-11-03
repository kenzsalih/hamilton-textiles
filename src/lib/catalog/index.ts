import { cache } from "react";
import { getRepo } from "@/lib/data";
import type { Category, Material } from "./types";

export type { Category, Material } from "./types";
export { localised } from "./types";

/** Active collections, in display order. */
export const getCategories = cache(async (): Promise<Category[]> => getRepo().listCategories());

/** Fabrics visible in the shop (hidden ones excluded), newest first. */
export const getMaterials = cache(async (): Promise<Material[]> => getRepo().listMaterials());

export async function getFeaturedMaterials(limit = 8): Promise<Material[]> {
  return (await getMaterials()).filter((m) => m.is_featured && m.stock_m > 0).slice(0, limit);
}

export async function getCatalogueStats() {
  const materials = await getMaterials();
  const categories = await getCategories();
  const inStock = materials.filter((m) => m.stock_m > 0);
  const countByCategory = new Map<string, number>();
  for (const m of inStock) countByCategory.set(m.category_id, (countByCategory.get(m.category_id) ?? 0) + 1);
  return {
    inStockCount: inStock.length,
    lowestPriceFils: inStock.length ? Math.min(...inStock.map((m) => m.price_fils)) : 0,
    categories: categories.map((c) => ({ ...c, count: countByCategory.get(c.id) ?? 0 })),
  };
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getMaterialBySlug(slug: string): Promise<Material | null> {
  return (await getMaterials()).find((m) => m.slug === slug) ?? null;
}

/** Same category first, then fabrics sharing an occasion. */
export async function getRelatedMaterials(material: Material, limit = 4): Promise<Material[]> {
  const others = (await getMaterials()).filter((m) => m.id !== material.id && m.stock_m > 0);
  const score = (m: Material) =>
    (m.category_id === material.category_id ? 10 : 0) + m.occasions.filter((o) => material.occasions.includes(o)).length;
  return others.sort((a, b) => score(b) - score(a)).slice(0, limit);
}
