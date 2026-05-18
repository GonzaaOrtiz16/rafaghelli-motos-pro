import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MIN_OFERTAS = 6;

export function useHomeData() {
  const productsQuery = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const [{ data, error }, { data: variants, error: vErr }] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, title, slug, price, original_price, images, category, brand, free_shipping, is_on_sale, is_featured, stock"
          )
          .order("created_at", { ascending: false }),
        supabase.from("product_variants").select("product_id, stock"),
      ]);
      if (error) throw error;
      if (vErr) throw vErr;
      const stockMap = new Map<string, number>();
      (variants || []).forEach((v: any) => {
        stockMap.set(v.product_id, (stockMap.get(v.product_id) || 0) + (v.stock || 0));
      });
      const withStock = (data || []).map((p: any) => ({
        ...p,
        stock: (p.stock || 0) + (stockMap.get(p.id) || 0),
      }));
      withStock.sort((a: any, b: any) => {
        const aOut = (a.stock || 0) <= 0 ? 1 : 0;
        const bOut = (b.stock || 0) <= 0 ? 1 : 0;
        return aOut - bOut;
      });
      return withStock;
    },
    staleTime: 1000 * 60 * 5,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categorias", "repuestos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, image")
        .eq("tipo", "repuestos")
        .order("nombre");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const siteSettingsQuery = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("home_media_url, home_media_type")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const products = productsQuery.data ?? [];

  const sections = useMemo(() => {
    const featuredProducts: any[] = [];
    const realOffers: any[] = [];
    const freeShipping: any[] = [];
    const inStockNonOffers: any[] = [];
    for (const p of products) {
      if ((p as any).is_featured === true) featuredProducts.push(p);
      if (p.is_on_sale === true && realOffers.length < MIN_OFERTAS) realOffers.push(p);
      else if ((p.stock || 0) > 0) inStockNonOffers.push(p);
      if (p.free_shipping === true && freeShipping.length < 4) freeShipping.push(p);
    }
    const featured: any[] = [...realOffers];
    let i = 0;
    while (featured.length < MIN_OFERTAS && i < inStockNonOffers.length) {
      const p = inStockNonOffers[i++];
      const seed = (p.id || "").split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
      const discount = 10 + (seed % 16);
      const fakeOriginal = Math.round((p.price / (1 - discount / 100)) / 100) * 100;
      featured.push({ ...p, original_price: fakeOriginal, is_on_sale: true });
    }
    return { featuredProducts, featured, freeShipping, recent: products.slice(0, 16) };
  }, [products]);

  return {
    isLoading: productsQuery.isLoading,
    categories: categoriesQuery.data ?? [],
    siteSettings: siteSettingsQuery.data,
    ...sections,
  };
}
