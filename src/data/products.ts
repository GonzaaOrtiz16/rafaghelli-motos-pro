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
  { id: "Transmisión", name: "Transmisión", icon: "wrench", image: "https://images.unsplash.com/photo-1772566385505-cfccf766b5f0?q=80&w=1631&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: "Frenos", name: "Frenos", icon: "disc", image: "https://images.unsplash.com/photo-1772566386564-017cfeb14ce0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: "Motor", name: "Motor", icon: "settings", image: "https://img.freepik.com/foto-gratis/vista-cercana-piezas-motocicleta_23-2150704627.jpg" },
  { id: "Cubiertas y Cámaras", name: "Cubiertas", icon: "circle", image: "https://images.unsplash.com/photo-1772566387970-40f3eaf44884?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: "Aceites y Filtros", name: "Aceites", icon: "droplets", image: "https://images.unsplash.com/photo-1772566384197-330880cb04ac?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: "Accesorios y Cascos", name: "Cascos", icon: "hard-hat", image: "https://images.unsplash.com/photo-1772566388989-1a7f1dc33b3a?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Bajaj", "LS2", "Motul", "Pirelli"];
export const ccOptions = ["110cc", "150cc", "200cc", "250cc", "600cc+"];

// Lista inicial vacía para que mande Supabase
export const products: Product[] = [];

// Funciones de ayuda actualizadas
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter(p => p.category === cat);
