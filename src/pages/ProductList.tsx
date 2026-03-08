import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [catFilter, setCatFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);

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

  // Categorías dinámicas
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'repuestos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('tipo', 'repuestos')
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  // Marcas dinámicas extraídas de los productos
  const dynamicBrands = useMemo(() => {
    const brandSet = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet).sort();
  }, [products]);

  // Categoría activa: priorizar parámetro URL, luego filtro manual
  const activeCat = catParam || catFilter;

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (activeCat && p.category !== activeCat) return false;
      if (qParam && !p.title.toLowerCase().includes(qParam) && !p.category.toLowerCase().includes(qParam) && !p.brand.toLowerCase().includes(qParam)) return false;
      if (brandFilter && p.brand !== brandFilter) return false;
      if (priceFilter >= 0) {
        const range = priceRanges[priceFilter];
        if (p.price < range.min || p.price > range.max) return false;
      }
      return true;
    });
  }, [products, activeCat, qParam, brandFilter, priceFilter]);

  const hasActiveFilters = !!(brandFilter || catFilter || catParam || priceFilter >= 0);

  const clearFilters = () => { 
    setBrandFilter(""); 
    setCatFilter(""); 
    setPriceFilter(-1); 
    setSearchParams({});
  };

  const FilterSection = () => (
    <div className="space-y-6">
      {/* Categorías dinámicas */}
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-orange-500">Categoría</h4>
        <div className="space-y-1">
          {categorias.map(c => (
            <button key={c.id} onClick={() => setCatFilter(catFilter === c.nombre ? "" : c.nombre)}
              className={`block w-full text-left text-xs font-bold uppercase px-3 py-2 rounded-lg transition-colors ${catFilter === c.nombre ? "bg-black text-white" : "hover:bg-muted text-gray-500"}`}>
              {c.nombre}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-orange-500">Marca</h4>
        <div className="space-y-1">
          {dynamicBrands.map(b => (
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
      <nav className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
        <Link to="/" className="hover:text-orange-500">Inicio</Link>
        <span>/</span>
        <span className="text-black">{activeCat || (qParam ? `"${qParam}"` : "Todos los productos")}</span>
      </nav>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
          {activeCat || (qParam ? `Buscando: ${qParam}` : "Catálogo Completo")}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold uppercase" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
          <Button variant="outline" size="sm" className="lg:hidden rounded-xl border-black" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
            <h3 className="font-black uppercase tracking-tighter text-lg mb-6 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-orange-500" /> Filtros
            </h3>
            <FilterSection />
          </div>
        </aside>

        {/* Mobile filters */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/80 z-50 lg:hidden flex justify-end">
            <div className="bg-white w-80 p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase">Filtros</h3>
                <button onClick={() => setShowFilters(false)} className="text-zinc-400">✕</button>
              </div>
              <FilterSection />
              <button onClick={() => setShowFilters(false)} className="w-full mt-6 bg-orange-500 text-white py-3 rounded-xl font-black uppercase text-sm">
                Aplicar
              </button>
            </div>
          </div>
        )}

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
                      <ProductCard product={p as any} />
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
