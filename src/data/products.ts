export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  brand: string;
  motoFit: string[];
  cc: string[];
  freeShipping: boolean;
  description: string;
  specs: Record<string, string>;
  variants?: { label: string; options: string[] }[];
  stock: number;
}

export const categories = [
  { id: "cascos", name: "Cascos", icon: "hard-hat", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop" },
  { id: "cubiertas", name: "Cubiertas", icon: "circle", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&h=300&fit=crop" },
  { id: "repuestos", name: "Repuestos", icon: "wrench", image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop" },
  { id: "aceites", name: "Aceites y Lubricantes", icon: "droplets", image: "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=400&h=300&fit=crop" },
];

export const brands = ["Honda", "Yamaha", "Suzuki", "Kawasaki", "Bajaj", "Zanella", "Motomel", "Corven"];
export const ccOptions = ["110cc", "125cc", "150cc", "200cc", "250cc", "300cc", "400cc+"];

export const products: Product[] = [
  {
    id: "1",
    title: "Casco Integral LS2 FF353 Rapid Negro Mate",
    slug: "casco-ls2-ff353-rapid-negro",
    price: 89990,
    originalPrice: 119990,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=600&fit=crop",
    ],
    category: "cascos",
    brand: "LS2",
    motoFit: ["Universal"],
    cc: [],
    freeShipping: true,
    description: "Casco integral LS2 FF353 Rapid con certificación DOT y ECE. Carcasa de policarbonato inyectado HPTT, ventilación dinámica y visor antirayones. Ideal para uso diario y rutas.",
    specs: { Marca: "LS2", Modelo: "FF353 Rapid", Tipo: "Integral", Certificación: "DOT / ECE 22.05", Material: "Policarbonato HPTT", Peso: "1450g", SKU: "LS2-FF353-NM" },
    variants: [{ label: "Talle", options: ["S", "M", "L", "XL"] }],
    stock: 15,
  },
  {
    id: "2",
    title: "Cubierta Pirelli Diablo Rosso II 120/70 R17",
    slug: "cubierta-pirelli-diablo-rosso-ii",
    price: 145000,
    images: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop",
    ],
    category: "cubiertas",
    brand: "Pirelli",
    motoFit: ["Honda", "Yamaha", "Kawasaki"],
    cc: ["250cc", "300cc", "400cc+"],
    freeShipping: true,
    description: "Cubierta deportiva Pirelli Diablo Rosso II. Excelente agarre en seco y mojado. Compuesto bi-blend para máximo rendimiento en calle y pista.",
    specs: { Marca: "Pirelli", Modelo: "Diablo Rosso II", Medida: "120/70 R17", Tipo: "Radial", Uso: "Sport/Calle", Origen: "Brasil", SKU: "PIR-DR2-12070R17" },
    stock: 8,
  },
  {
    id: "3",
    title: "Kit de Arrastre Honda CB 190R - Cadena + Piñón + Corona",
    slug: "kit-arrastre-honda-cb190r",
    price: 42500,
    originalPrice: 52000,
    images: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop",
    ],
    category: "repuestos",
    brand: "Honda",
    motoFit: ["Honda"],
    cc: ["150cc", "200cc"],
    freeShipping: false,
    description: "Kit de arrastre completo para Honda CB 190R. Incluye cadena reforzada 428H, piñón de 14 dientes y corona de 43 dientes. Acero tratado térmicamente.",
    specs: { Marca: "JT Sprockets", Compatible: "Honda CB 190R", Cadena: "428H x 130L", Piñón: "14T", Corona: "43T", Material: "Acero templado", SKU: "KIT-CB190R-01" },
    stock: 12,
  },
  {
    id: "4",
    title: "Aceite Motul 7100 10W40 4T Sintético 1L",
    slug: "aceite-motul-7100-10w40",
    price: 18900,
    images: [
      "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=600&h=600&fit=crop",
    ],
    category: "aceites",
    brand: "Motul",
    motoFit: ["Universal"],
    cc: [],
    freeShipping: false,
    description: "Aceite 100% sintético Motul 7100 para motores 4T. Tecnología ESTER para máxima protección del motor y caja de cambios. Norma JASO MA2.",
    specs: { Marca: "Motul", Línea: "7100", Viscosidad: "10W40", Tipo: "100% Sintético", Volumen: "1 Litro", Norma: "JASO MA2 / API SN", SKU: "MOT-7100-10W40-1L" },
    stock: 30,
  },
  {
    id: "5",
    title: "Casco Abierto Hawk RS5 con Visor Negro Brillante",
    slug: "casco-hawk-rs5-negro",
    price: 45990,
    images: [
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=600&fit=crop",
    ],
    category: "cascos",
    brand: "Hawk",
    motoFit: ["Universal"],
    cc: [],
    freeShipping: true,
    description: "Casco abierto Hawk RS5 con visor rebatible y sunvisor interno. Carcasa en ABS, interior desmontable y lavable.",
    specs: { Marca: "Hawk", Modelo: "RS5", Tipo: "Abierto / Jet", Material: "ABS", Visor: "Transparente + Sunvisor", SKU: "HWK-RS5-NB" },
    variants: [{ label: "Talle", options: ["S", "M", "L", "XL"] }],
    stock: 20,
  },
  {
    id: "6",
    title: "Pastillas de Freno EBC Yamaha YZF R3 Delanteras",
    slug: "pastillas-freno-ebc-r3",
    price: 12500,
    images: [
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop",
    ],
    category: "repuestos",
    brand: "Yamaha",
    motoFit: ["Yamaha"],
    cc: ["300cc"],
    freeShipping: false,
    description: "Pastillas de freno sinterizadas EBC para Yamaha YZF R3 (delantera). Excelente poder de frenado en seco y mojado.",
    specs: { Marca: "EBC", Compatible: "Yamaha YZF-R3", Posición: "Delantera", Tipo: "Sinterizada", SKU: "EBC-FA375HH" },
    stock: 25,
  },
  {
    id: "7",
    title: "Cubierta Michelin Pilot Street 140/70 R17",
    slug: "cubierta-michelin-pilot-street",
    price: 98000,
    originalPrice: 115000,
    images: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop",
    ],
    category: "cubiertas",
    brand: "Michelin",
    motoFit: ["Honda", "Yamaha", "Suzuki"],
    cc: ["150cc", "200cc", "250cc"],
    freeShipping: true,
    description: "Cubierta trasera Michelin Pilot Street. Diseño de banda de rodamiento optimizado para uso urbano y carretero.",
    specs: { Marca: "Michelin", Modelo: "Pilot Street", Medida: "140/70 R17", Uso: "Calle/Touring", Origen: "Tailandia", SKU: "MCH-PS-14070R17" },
    stock: 6,
  },
  {
    id: "8",
    title: "Aceite YPF Elaion Moto 4T 20W50 Mineral 1L",
    slug: "aceite-ypf-elaion-moto-20w50",
    price: 8500,
    images: [
      "https://images.unsplash.com/photo-1635784874058-f699b89c7734?w=600&h=600&fit=crop",
    ],
    category: "aceites",
    brand: "YPF",
    motoFit: ["Universal"],
    cc: [],
    freeShipping: false,
    description: "Aceite mineral YPF Elaion Moto 4T. Formulación especial para motores de motos 4 tiempos. Protección antidesgaste.",
    specs: { Marca: "YPF", Línea: "Elaion Moto", Viscosidad: "20W50", Tipo: "Mineral", Volumen: "1 Litro", SKU: "YPF-EM-20W50-1L" },
    stock: 50,
  },
];

export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter(p => p.category === cat);
