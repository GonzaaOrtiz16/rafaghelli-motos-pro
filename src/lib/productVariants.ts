import { supabase } from "@/integrations/supabase/client";

export interface LegacyVariant {
  color: string;
  image?: string | null;
  price?: number | null;
  sizes: Record<string, number>;
  stock: number; // sum of sizes (or own stock if no sizes)
  moto_fit?: string[];
}

interface VariantRow {
  id?: string;
  product_id: string;
  color: string | null;
  size: string | null;
  stock: number;
  price: number | null;
  image: string | null;
  moto_fit: string[] | null;
  position: number;
}

/** Group flat rows into legacy color-keyed structure used by the UI. */
export function groupVariantRows(rows: VariantRow[]): LegacyVariant[] {
  const map = new Map<string, LegacyVariant>();
  rows
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((r) => {
      const colorKey = r.color ?? "";
      if (!map.has(colorKey)) {
        map.set(colorKey, {
          color: r.color ?? "",
          image: r.image,
          price: r.price,
          sizes: {},
          stock: 0,
          moto_fit: r.moto_fit ?? [],
        });
      }
      const v = map.get(colorKey)!;
      if (r.size) {
        v.sizes[r.size] = r.stock;
      } else {
        v.stock = r.stock;
      }
      // Prefer non-null image/price/moto_fit if missing
      if (!v.image && r.image) v.image = r.image;
      if (v.price == null && r.price != null) v.price = r.price;
      if ((!v.moto_fit || v.moto_fit.length === 0) && r.moto_fit?.length) v.moto_fit = r.moto_fit;
    });
  // Compute total stock as sum of sizes when sizes exist
  return Array.from(map.values()).map((v) => {
    const sizeKeys = Object.keys(v.sizes);
    if (sizeKeys.length > 0) {
      v.stock = sizeKeys.reduce((s, k) => s + (v.sizes[k] || 0), 0);
    }
    return v;
  });
}

/** Fetch variants for a single product, grouped. */
export async function loadVariantsForProduct(productId: string): Promise<LegacyVariant[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);
  if (error || !data) return [];
  return groupVariantRows(data as VariantRow[]);
}

/** Fetch variants for many products in one query. */
export async function loadVariantsForProducts(
  productIds: string[]
): Promise<Map<string, LegacyVariant[]>> {
  const result = new Map<string, LegacyVariant[]>();
  if (productIds.length === 0) return result;
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", productIds);
  if (error || !data) return result;
  const grouped = new Map<string, VariantRow[]>();
  (data as VariantRow[]).forEach((r) => {
    if (!grouped.has(r.product_id)) grouped.set(r.product_id, []);
    grouped.get(r.product_id)!.push(r);
  });
  grouped.forEach((rows, pid) => {
    result.set(pid, groupVariantRows(rows));
  });
  return result;
}

/**
 * Replace all variants for a product with the given legacy structure.
 * The trigger in DB will recalc products.stock automatically.
 */
export async function saveProductVariants(
  productId: string,
  variants: LegacyVariant[]
): Promise<{ error: any | null }> {
  // Delete all existing
  const { error: delErr } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (delErr) return { error: delErr };

  // Build flat rows
  const rows: Omit<VariantRow, "id">[] = [];
  variants.forEach((v, idx) => {
    const color = v.color?.trim() || null;
    const sizeKeys = Object.keys(v.sizes || {});
    if (sizeKeys.length === 0) {
      rows.push({
        product_id: productId,
        color,
        size: null,
        stock: Number(v.stock) || 0,
        price: v.price ?? null,
        image: v.image ?? null,
        moto_fit: v.moto_fit ?? [],
        position: idx,
      });
    } else {
      sizeKeys.forEach((sk, si) => {
        rows.push({
          product_id: productId,
          color,
          size: sk,
          stock: Number(v.sizes[sk]) || 0,
          price: v.price ?? null,
          image: v.image ?? null,
          moto_fit: v.moto_fit ?? [],
          position: idx * 100 + si,
        });
      });
    }
  });

  if (rows.length === 0) {
    return { error: null };
  }
  const { error: insErr } = await supabase.from("product_variants").insert(rows);
  return { error: insErr };
}
