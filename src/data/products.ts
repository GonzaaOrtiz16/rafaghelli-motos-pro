import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  discount_price?: number;
  images: string[];
  category: string;
  brand: string;
  has_free_shipping: boolean;
  description: string;
  stock: number;
  is_on_sale?: boolean;
  created_at?: string;
}

// Categorías oficiales de Rafaghelli Motos para los filtros de la web
export const categories = [
  { id: "Transmisión", name: "Transmisión", icon: "wrench", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Frenos", name: "Frenos", icon: "disc", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Motor", name: "Motor", icon: "settings", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Cubiertas y Cámaras", name: "Cubiertas", icon: "circle", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop" },
  { id: "Aceites y Filtros", name: "Aceites", icon: "droplets", image: "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=400&h=300&fit=crop" },
  { id: "Accesorios y Cascos", name: "Cascos", icon: "hard-hat", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop" },
  { id: "Electricidad", name: "Electricidad", icon: "zap", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Suspensión", name: "Suspensión", icon: "arrow-up-down", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "Zanella", "Motomel", "Corven", "LS2", "Hawk", "Motul", "Pirelli", "Michelin"];

// LISTA VACÍA: Ahora la web no mostrará productos "fantasmas". 
// Todo vendrá desde Supabase a través de useQuery en los componentes.
export const products: Product[] = [];

/**
 * NOTA: Estas funciones estáticas ya no se usarán. 
 * Ahora usamos Supabase directamente en Index.tsx y Products.tsx
 */
export const getProductBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
};

export const getProductsByCategory = async (cat: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', cat);
  return data;
};
