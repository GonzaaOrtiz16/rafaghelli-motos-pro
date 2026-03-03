import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products, categories, brands, ccOptions } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useState, useMemo } from "react";

const priceRanges = [
  { label: "Hasta $20.000", min: 0, max: 20000 },
  { label: "$20.000 - $50.000", min: 20000, max: 50000 },
  { label: "$50.000 - $100.000", min: 50000, max: 100000 },
  { label: "Más de $100.000", min: 100000, max: Infinity },
];

const ProductList = () => {
  const [params] = useSearchParams();
  const catParam = params.get("categoria");
  const qParam = params.get("q")?.toLowerCase() || "";

  const [brandFilter, setBrandFilter] = useState<string>("");
  const [ccFilter, setCcFilter] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<number>(-1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (catParam && p.category !== catParam) return false;
      if (qParam && !p.title.toLowerCase().includes(qParam) && !p.category.includes(qParam)) return false;
      if (brandFilter && !p.motoFit.includes(brandFilter) && p.brand !== brandFilter) return false;
      if (ccFilter && !p.cc.includes(ccFilter)) return false;
      if (priceFilter >= 0) {
        const range = priceRanges[priceFilter];
        if (p.price < range.min || p.price > range.max) return false;
      }
      return true;
    });
  }, [catParam, qParam, brandFilter, ccFilter, priceFilter]);

  const activeCategory = categories.find(c => c.id === catParam);
  const hasFilters = brandFilter || ccFilter || priceFilter >= 0;

  const clearFilters = () => { setBrandFilter(""); setCcFilter(""); setPriceFilter(-1); };

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-2">Marca de moto</h4>
        <div className="space-y-1">
          {brands.map(b => (
            <button key={b} onClick={() => setBrandFilter(brandFilter === b ? "" : b)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${brandFilter === b ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {b}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Cilindrada</h4>
        <div className="space-y-1">
          {ccOptions.map(cc => (
            <button key={cc} onClick={() => setCcFilter(ccFilter === cc ? "" : cc)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${ccFilter === cc ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {cc}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Precio</h4>
        <div className="space-y-1">
          {priceRanges.map((r, i) => (
            <button key={i} onClick={() => setPriceFilter(priceFilter === i ? -1 : i)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${priceFilter === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-primary">Inicio</Link>
        <span>/</span>
        <span className="text-foreground">{activeCategory?.name || (qParam ? `"${qParam}"` : "Todos los productos")}</span>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold">
          {activeCategory?.name || (qParam ? `Resultados para "${qParam}"` : "Todos los productos")}
        </h2>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtros
        </Button>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          {brandFilter && <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{brandFilter} <button onClick={() => setBrandFilter("")}><X className="h-3 w-3" /></button></span>}
          {ccFilter && <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{ccFilter} <button onClick={() => setCcFilter("")}><X className="h-3 w-3" /></button></span>}
          {priceFilter >= 0 && <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">{priceRanges[priceFilter].label} <button onClick={() => setPriceFilter(-1)}><X className="h-3 w-3" /></button></span>}
          <button onClick={clearFilters} className="text-xs text-primary hover:underline">Limpiar todos</button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-32 bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filtros</h3>
            <FilterSection />
          </div>
        </aside>

        {/* Mobile filters */}
        {showFilters && (
          <div className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" onClick={() => setShowFilters(false)}>
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="absolute left-0 top-0 h-full w-72 bg-card p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filtros</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
              </div>
              <FilterSection />
            </motion.div>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg mb-2">No se encontraron productos</p>
              <Button variant="outline" onClick={clearFilters}>Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
