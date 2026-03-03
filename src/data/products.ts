import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  original_price?: number; // Ajustado a Supabase
  images: string[];
  category: string;
  brand: string;
  moto_fit?: string[];    
  cc?: string[];          
  free_shipping: boolean; // Ajustado a Supabase
  description: string;
  stock: number;
  is_on_sale?: boolean;
  created_at?: string;
}

export const categories = [
  { id: "Transmisión", name: "Transmisión", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800" },
  { id: "Frenos", name: "Frenos", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800" },
  { id: "Motor", name: "Motor", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800" },
  { id: "Cubiertas", name: "Cubiertas", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800" },
  { id: "Aceites", name: "Aceites", image: "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=800" },
  { id: "Cascos", name: "Cascos", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Bajaj", "LS2", "Motul", "Pirelli"];
export const ccOptions = ["110cc", "150cc", "200cc", "250cc", "600cc+"];

// Lista vacía: la web ahora leerá directo de Supabase usando useQuery
export const products: Product[] = [];

// Funciones de ayuda actualizadas
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter(p => p.category === cat);
