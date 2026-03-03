import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, Truck, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  // CONEXIÓN A SUPABASE: Traemos los productos reales
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Filtramos usando los datos de la base de datos
  const featured = products.filter(p => p.is_on_sale || p.discount_price);
  const freeShipping = products.filter(p => p.has_free_shipping);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-foreground/95 to-primary/20 text-background">
        <div className="container py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4">
              Todo para tu moto en <span className="text-primary">un solo lugar</span>
            </h2>
            <p className="text-lg opacity-80 mb-6">Repuestos, accesorios y taller especializado. Envíos a todo el país.</p>
            <form onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/productos?q=${encodeURIComponent(q)}`); }} className="flex max-w-lg">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="flex-1 px-4 py-3 rounded-l-lg text-foreground bg-card border-0 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" variant="cta" size="lg" className="rounded-l-none rounded-r-lg">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b">
        <div className="container py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Truck, text: "Envíos a todo el país", sub: "Garantizado por @gos_motos" },
              { icon: Shield, text: "Garantía oficial", sub: "En todos los productos" },
              { icon: CreditCard, text: "Pagos Seguros", sub: "Efectivo o Transferencia" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 py-2">
                <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{text}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-display font-bold">Categorías</h3>
          <Link to="/productos" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Ver todo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link to={`/productos?categoria=${cat.id}`} className="category-card block">
                <div className="aspect-[4/3] relative rounded-xl overflow-hidden">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h4 className="text-background font-display font-bold text-lg">{cat.name}</h4>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ofertas (Cargando desde Supabase) */}
      <section className="bg-muted/50">
        <div className="container py-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display font-bold">🔥 Ofertas</h3>
            <Link to="/productos" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Ver más <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-64 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.length > 0 ? (
                featured.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-400 py-10">No hay ofertas publicadas.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Envío gratis (Cargando desde Supabase) */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-display font-bold">🚚 Envío gratis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {!isLoading && freeShipping.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
