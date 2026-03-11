import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Loader2, X } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const ProductList = () => {
  const [params, setSearchParams] = useSearchParams();
  const catParam = params.get("categoria");
  const qParam = params.get("q")?.toLowerCase() || "";

  const [brandFilter, setBrandFilter] = useState<string>("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, title, slug, price, original_price, images, category, brand, free_shipping, is_on_sale, stock').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'repuestos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('id, nombre').eq('tipo', 'repuestos').order('nombre');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const dynamicBrands = useMemo(() => {
    const brandSet = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brandSet).sort();
  }, [products]);

  const activeCat = catFilter || catParam || "";

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (activeCat && p.category !== activeCat) return false;
      if (qParam && !p.title.toLowerCase().includes(qParam) && !(p.category || '').toLowerCase().includes(qParam) && !(p.brand || '').toLowerCase().includes(qParam)) return false;
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

  const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`block w-full text-left text-xs font-bold uppercase px-3 py-2 rounded-lg transition-colors ${active ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground"}`}
    >
      {children}
    </motion.button>
  );

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-primary">Categoría</h4>
        <div className="space-y-1">
          {categorias.map(c => (
            <FilterButton key={c.id} active={catFilter === c.nombre} onClick={() => setCatFilter(catFilter === c.nombre ? "" : c.nombre)}>
              {c.nombre}
            </FilterButton>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-primary">Marca</h4>
        <div className="space-y-1">
          {dynamicBrands.map(b => (
            <FilterButton key={b} active={brandFilter === b} onClick={() => setBrandFilter(brandFilter === b ? "" : b)}>
              {b}
            </FilterButton>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-primary">Precio</h4>
        <div className="space-y-1">
          {priceRanges.map((r, i) => (
            <FilterButton key={i} active={priceFilter === i} onClick={() => setPriceFilter(priceFilter === i ? -1 : i)}>
              {r.label}
            </FilterButton>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-6 min-h-screen">
      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2"
      >
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <span>/</span>
        <span className="text-foreground">{activeCat || (qParam ? `"${qParam}"` : "Todos los productos")}</span>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">
          {activeCat || (qParam ? `Buscando: ${qParam}` : "Catálogo Completo")}
        </h2>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold uppercase" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="outline" size="sm" className="lg:hidden rounded-xl border-foreground" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
          </Button>
        </div>
      </motion.div>

      <div className="flex gap-8">
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block w-64 flex-shrink-0"
        >
          <div className="sticky top-24 bg-card rounded-[32px] border border-border p-6 shadow-sm">
            <h3 className="font-black uppercase tracking-tighter text-lg mb-6 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> Filtros
            </h3>
            <FilterSection />
          </div>
        </motion.aside>

        {/* Mobile filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/80 z-50 lg:hidden flex justify-end"
              onClick={() => setShowFilters(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-card w-80 p-6 overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase">Filtros</h3>
                  <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <FilterSection />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-xl font-black uppercase text-sm"
                >
                  Aplicar
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="text-primary mb-4" size={40} />
              </motion.div>
              <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Cargando repuestos...</p>
            </div>
          ) : (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6"
              >
                {filtered.length} productos encontrados
              </motion.p>
              
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20 bg-muted rounded-[40px] border-2 border-dashed border-border"
                >
                  <p className="text-lg font-bold text-muted-foreground mb-4 tracking-tighter uppercase">No hay resultados para esta búsqueda</p>
                  <Button variant="outline" className="rounded-full border-foreground uppercase font-black text-xs" onClick={clearFilters}>Limpiar filtros</Button>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={stagger}
                  className="grid grid-cols-2 md:grid-cols-3 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((p) => (
                      <motion.div
                        key={p.id}
                        variants={fadeUp}
                        layout
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                      >
                        <ProductCard product={p as any} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
