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
  { id: "Transmisión", name: "Transmisión", icon: "wrench", image: "https://unsplash.com/es/fotos/un-primer-plano-de-un-reloj-9ehmPYBJkyU" },
  { id: "Frenos", name: "Frenos", icon: "disc", image: "https://unsplash.com/es/fotos/primer-plano-del-sistema-de-frenos-delanteros-de-una-motocicleta-sKGyaOusfLQ" },
  { id: "Motor", name: "Motor", icon: "settings", image: "https://unsplash.com/es/fotos/primer-plano-de-las-manos-de-la-mujer-del-tecnico-del-vehiculo-en-los-guantes-de-trabajo-que-fijan-las-piezas-metalicas-del-automovil-del-acero-inoxidable-rmVrCYNZ1Qk" },
  { id: "Cubiertas y Cámaras", name: "Cubiertas", icon: "circle", image: "https://unsplash.com/es/fotos/una-motocicleta-estacionada-en-la-cima-de-un-exuberante-campo-verde-9PGdccvTfjc" },
  { id: "Aceites y Filtros", name: "Aceites", icon: "droplets", image: "https://unsplash.com/es/fotos/la-botella-de-refrigerante-se-coloca-en-una-motocicleta-61VqlOr9-Ss" },
  { id: "Accesorios y Cascos", name: "Cascos", icon: "hard-hat", image: "https://unsplash.com/es/fotos/persona-con-casco-negro-y-chaqueta-azul-DgwCCZeVrG4" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Bajaj", "LS2", "Motul", "Pirelli"];
export const ccOptions = ["110cc", "150cc", "200cc", "250cc", "600cc+"];

// Lista inicial vacía para que mande Supabase
export const products: Product[] = [];

// Funciones de ayuda actualizadas
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter(p => p.category === cat);
