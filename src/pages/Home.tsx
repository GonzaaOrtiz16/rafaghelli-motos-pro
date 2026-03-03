import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, Truck, Shield, CreditCard, ArrowRight } from "lucide-react";
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

  // CONEXIÓN A SUPABASE
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

  // Filtros ajustados a los nombres de tu base de datos
  const featured = products.filter(p => p.original_price && p.original_price > p.price);
  const freeShipping = products.filter(p => p.free_shipping);

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

      {/* Sección de Categorías */}
      <section className="container py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black uppercase tracking-tighter">Categorías</h3>
          <Link to="/productos" className="text-orange-500 text-xs font-bold uppercase hover:underline">Ver todas ›</Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/productos?categoria=${cat.id}`} 
              className="group flex flex-col items-center text-center gap-3"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 group-hover:border-orange-500 transition-all shadow-sm">
                <img 
                  src={cat.image} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={cat.name} 
                />
                <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-tight text-gray-700 group-hover:text-orange-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ofertas */}
      <section className="bg-muted/50">
        <div className="container py-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-display font-bold">🔥 Ofertas</h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-64 bg-gray-200 animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.length > 0 ? (
                featured.slice(0, 4).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-400 py-10 font-medium italic">Buscando las mejores ofertas para vos...</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Envío gratis */}
      <section className="container py-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-display font-bold">🚚 Envío gratis</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {!isLoading && freeShipping.slice(0, 4).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>

        {/* BOTÓN VER TODOS LOS PRODUCTOS */}
        <div className="flex justify-center pb-10">
          <Link to="/productos">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-7 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-xl shadow-orange-500/20 group transition-all"
            >
              Ver todos los productos
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
