import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  original_price?: number; // Ajustado a tu Supabase
  images: string[];
  category: string;
  brand: string;
  free_shipping: boolean; // Ajustado a tu Supabase
  description: string;
  stock: number;
  is_on_sale?: boolean;
  moto_fit?: string[];    
  cc?: string[];          
  created_at?: string;
}

// Categorías para Rafaghelli Motos
export const categories = [
  { id: "Transmisión", name: "Transmisión", icon: "wrench", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Frenos", name: "Frenos", icon: "disc", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Motor", name: "Motor", icon: "settings", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "Cubiertas y Cámaras", name: "Cubiertas", icon: "circle", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop" },
  { id: "Aceites y Filtros", name: "Aceites", icon: "droplets", image: "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=400&h=300&fit=crop" },
  { id: "Accesorios y Cascos", name: "Cascos", icon: "hard-hat", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Bajaj", "LS2", "Motul", "Pirelli"];
export const ccOptions = ["110cc", "150cc", "200cc", "250cc", "600cc+"];

// Lista inicial vacía para que mande Supabase
export const products: Product[] = [];

// Funciones de ayuda actualizadas
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter(p => p.category === cat);
