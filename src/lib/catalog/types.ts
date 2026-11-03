export type FabricPattern =
  | "plain"
  | "crepe"
  | "twill"
  | "satin"
  | "linen"
  | "stripe"
  | "floral"
  | "lace"
  | "chiffon";

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  sort_order: number;
  /** Swatch colour used when the category has no photo yet. */
  accent_hex?: string;
  accent_pattern?: FabricPattern;
};

export type Material = {
  id: string;
  slug: string;
  sku: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  composition: string | null;
  width_cm: number | null;
  weight_gsm: number | null;
  colour_name_en: string | null;
  colour_name_ar: string | null;
  colour_hex: string | null;
  pattern: FabricPattern;
  occasions: string[];
  price_fils: number;
  compare_at_fils: number | null;
  stock_m: number;
  low_stock_m: number;
  min_order_m: number;
  step_m: number;
  is_featured: boolean;
  created_at: string;
  images: { url: string; alt_en: string | null; alt_ar: string | null }[];
};

export type Localised = "en" | "ar";

export function localised<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: string,
): string {
  const key = `${field}_${locale === "ar" ? "ar" : "en"}`;
  return (row[key] as string | null) ?? (row[`${field}_en`] as string | null) ?? "";
}
