import { cache } from "react";
import { getPublicSupabase } from "@/lib/supabase/public";
import { seedCategories, seedMaterials } from "./seed";
import type { Category, Material } from "./types";

export type { Category, Material } from "./types";
export { localised } from "./types";

const MATERIAL_COLUMNS =
  "*, images:material_images(url, alt_en, alt_ar, sort_order)";

export const getCategories = cache(async (): Promise<Category[]> => {
  const db = getPublicSupabase();
  if (!db) return seedCategories;
  const { data, error } = await db.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data as Category[];
});

export const getMaterials = cache(async (): Promise<Material[]> => {
  const db = getPublicSupabase();
  if (!db) return seedMaterials;
  const { data, error } = await db
    .from("materials")
    .select(MATERIAL_COLUMNS)
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "material_images" });
  if (error) throw error;
  return (data as Material[]).map((m) => ({ ...m, stock_m: Number(m.stock_m) }));
});

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
    lowestPriceFils: Math.min(...inStock.map((m) => m.price_fils)),
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
