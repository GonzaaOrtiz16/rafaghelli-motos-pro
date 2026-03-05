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

  // FILTROS CORREGIDOS (A prueba de errores de tipo de dato)
  const featured = products.filter(p => 
    p.original_price && 
    Number(p.original_price) > Number(p.price)
  );

  const freeShipping = products.filter(p => 
    p.free_shipping === true || p.free_shipping === "true"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-zinc-900 text-white">
        <div className="container py-12 md:py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6">
              Todo para tu moto en <span className="text-orange-500">un solo lugar</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 font-medium">Repuestos, accesorios y taller especializado. Envíos a todo el país.</p>
            <form onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/productos?q=${encodeURIComponent(q)}`); }} className="flex max-w-lg bg-white rounded-2xl p-1 shadow-2xl">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="flex-1 px-5 py-3 rounded-l-xl text-black outline-none font-medium"
              />
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 rounded-xl px-6 h-12">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-b bg-zinc-50">
        <div className="container py-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Truck, text: "Envíos a todo el país", sub: "Garantizado por @gos_motos" },
              { icon: Shield, text: "Garantía oficial", sub: "En todos los productos" },
              { icon: CreditCard, text: "Pagos Seguros", sub: "Efectivo o Transferencia" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-4 py-2">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <Icon className="h-6 w-6 text-orange-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">{text}</p>
                  <p className="text-xs text-gray-500 font-medium">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de Categorías */}
      <section className="container py-16 px-6">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter italic">Categorías</h3>
          <Link to="/productos" className="text-orange-500 text-xs font-black uppercase tracking-widest hover:underline">Ver todas ›</Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/productos?categoria=${cat.id}`} 
              className="group flex flex-col items-center text-center gap-3"
            >
              <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-zinc-100 border border-transparent group-hover:border-orange-500 transition-all shadow-sm">
                <img 
                  src={cat.image} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={cat.name} 
                />
                <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-800 group-hover:text-orange-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ofertas */}
      <section className="bg-zinc-900 py-20 px-6">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
              <span className="text-orange-500 text-3xl">🔥</span> Ofertas Reales
            </h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-80 bg-zinc-800 animate-pulse rounded-[2.5rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.length > 0 ? (
                featured.slice(0, 4).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <ProductCard product={p} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Próximamente nuevas ofertas...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Envío gratis */}
      <section className="container py-20 px-6">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
            <Truck className="text-orange-500" /> Envío sin cargo
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {!isLoading && freeShipping.length > 0 ? (
            freeShipping.slice(0, 4).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <ProductCard product={p} />
              </motion.div>
            ))
          ) : (
            <p className="col-span-full text-center text-zinc-400 py-10 font-medium italic">Todos nuestros productos tienen envío a convenir.</p>
          )}
        </div>

        {/* BOTÓN FINAL */}
        <div className="flex justify-center pb-10">
          <Link to="/productos">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white h-20 px-12 rounded-[2.5rem] text-xl font-black uppercase tracking-tighter shadow-2xl shadow-orange-500/40 group transition-all"
            >
              Explorar Catálogo Completo
              <ArrowRight className="ml-3 h-7 w-7 group-hover:translate-x-3 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
