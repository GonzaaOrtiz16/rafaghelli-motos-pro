import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories, brands, ccOptions } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const priceRanges = [
  { label: "Hasta $20.000", min: 0, max: 20000 },
  { label: "$20.000 - $50.000", min: 20000, max: 50000 },
  { label: "$50.000 - $100.000", min: 50000, max: 100000 },
  { label: "Más de $100.000", min: 100000, max: Infinity },
];

const ProductList = () => {
  const [params, setSearchParams] = useSearchParams();
  const catParam = params.get("categoria");
  const qParam = params.get("q")?.toLowerCase() || "";

  const [brandFilter, setBrandFilter] = useState<string>("");
  const [ccFilter, setCcFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);

  // CONSULTA A SUPABASE
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filtered = useMemo(() => {
    return products.filter(p => {
      // 1. Filtro por Categoría (URL)
      if (catParam && p.category !== catParam) return false;
      
      // 2. Filtro por Búsqueda (URL)
      if (qParam && !p.title.toLowerCase().includes(qParam) && !p.category.toLowerCase().includes(qParam)) return false;
      
      // 3. Filtro por Marca (Sidebar)
      if (brandFilter && p.brand !== brandFilter) return false;
      
      // 4. Filtro por Precio (Sidebar) - Usamos el precio final (con descuento si tiene)
      if (priceFilter >= 0) {
        const range = priceRanges[priceFilter];
        const currentPrice = p.price;
        if (currentPrice < range.min || currentPrice > range.max) return false;
      }
      
      return true;
    });
  }, [products, catParam, qParam, brandFilter, priceFilter]);

  const activeCategory = categories.find(c => c.id === catParam);
  const hasFilters = brandFilter || ccFilter || priceFilter >= 0;

  const clearFilters = () => { 
    setBrandFilter(""); 
    setCcFilter(""); 
    setPriceFilter(-1); 
    setSearchParams({}); // También limpia la búsqueda de la URL
  };

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-orange-500">Marca</h4>
        <div className="space-y-1">
          {brands.map(b => (
            <button key={b} onClick={() => setBrandFilter(brandFilter === b ? "" : b)}
              className={`block w-full text-left text-xs font-bold uppercase px-3 py-2 rounded-lg transition-colors ${brandFilter === b ? "bg-black text-white" : "hover:bg-muted text-gray-500"}`}>
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-orange-500">Precio</h4>
        <div className="space-y-1">
          {priceRanges.map((r, i) => (
            <button key={i} onClick={() => setPriceFilter(priceFilter === i ? -1 : i)}
              className={`block w-full text-left text-xs font-bold uppercase px-3 py-2 rounded-lg transition-colors ${priceFilter === i ? "bg-black text-white" : "hover:bg-muted text-gray-500"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-6 min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Inicio</Link>
        <span>/</span>
        <span className="text-black">{activeCategory?.name || (qParam ? `"${qParam}"` : "Todos los productos")}</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
          {activeCategory?.name || (qParam ? `Buscando: ${qParam}` : "Catálogo Completo")}
        </h2>
        <Button variant="outline" size="sm" className="lg:hidden rounded-xl border-black" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
        </Button>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <h3 className="font-black uppercase tracking-tighter text-lg mb-6 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-orange-500" /> Filtros
            </h3>
            <FilterSection />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
              <p className="font-bold uppercase tracking-widest text-xs text-gray-400">Cargando repuestos...</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">
                {filtered.length} productos encontrados
              </p>
              
              {filtered.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                  <p className="text-lg font-bold text-gray-400 mb-4 tracking-tighter uppercase">No hay resultados para esta búsqueda</p>
                  <Button variant="outline" className="rounded-full border-black uppercase font-black text-xs" onClick={clearFilters}>Limpiar filtros</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {filtered.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
