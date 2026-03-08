import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Truck, Shield, CreditCard, ArrowRight, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

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

  // Categorías dinámicas de repuestos desde la BD
  const { data: categories = [] } = useQuery({
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

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const featured = products.filter(p => p.is_on_sale === true);
  const freeShipping = products.filter(p => p.free_shipping === true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/productos?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video Background */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero-wheelie.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <div className="container py-16 md:py-28 px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              Rafaghelli <span className="text-orange-500">Motos</span>
            </h2>
            <p className="text-zinc-400 text-lg md:text-xl mb-10 font-medium max-w-xl">
              Repuestos originales y accesorios premium. Potenciamos tu viaje con la garantía de @rafaghellimotos.
            </p>
            
            <form onSubmit={handleSearch} className="flex max-w-lg bg-white rounded-2xl p-1.5 shadow-2xl">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscá por marca o repuesto..."
                className="flex-1 px-5 py-3 rounded-l-xl text-black outline-none font-bold placeholder:text-zinc-400"
              />
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-8 h-12 font-black uppercase tracking-tight">
                <Search className="h-5 w-5 mr-2" /> Buscar
              </Button>
            </form>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent hidden md:block" />
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-zinc-50">
        <div className="container py-8 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, text: "Envíos a todo el país", sub: "Llegamos donde estés" },
              { icon: Shield, text: "Calidad Garantizada", sub: "Repuestos seleccionados" },
              { icon: CreditCard, text: "Pagos Flexibles", sub: "Transferencia o Efectivo" },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-5 group">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 group-hover:bg-orange-500 transition-colors duration-300">
                  <Icon className="h-6 w-6 text-orange-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{text}</p>
                  <p className="text-xs text-zinc-500 font-bold">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías Dinámicas */}
      <section className="container py-20 px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-orange-500 font-black uppercase text-xs tracking-[0.2em]">Explorar</span>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Categorías</h3>
          </div>
          <Link to="/productos" className="bg-zinc-100 hover:bg-zinc-200 p-3 rounded-full transition-colors">
            <ArrowRight className="h-5 w-5 text-zinc-900" />
          </Link>
        </div>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/productos?categoria=${cat.nombre}`} className="group flex flex-col items-center text-center gap-4">
                <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden bg-zinc-100 border-4 border-transparent group-hover:border-orange-500 transition-all duration-500 shadow-lg">
                  {cat.image ? (
                    <img src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.nombre} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-zinc-400 font-black uppercase text-xs">{cat.nombre[0]}</div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-900">{cat.nombre}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 rounded-[3rem]">
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Creá categorías desde el panel Admin</p>
          </div>
        )}
      </section>

      {/* Banner Motos en Venta */}
      <section className="mx-4 md:mx-10 my-10">
        <Link to="/motos" className="block group">
          <div className="bg-zinc-900 rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
              <span className="text-orange-500 font-black uppercase text-[10px] tracking-[0.3em]">Nueva Sección</span>
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-none mt-2">
                Motos en <span className="text-orange-500">Venta</span>
              </h3>
              <p className="text-zinc-400 font-medium mt-3 max-w-md">0km y usadas seleccionadas con garantía Rafaghelli.</p>
              <div className="mt-6 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all group-hover:gap-4">
                Ver Motos <ArrowRight size={18} />
              </div>
            </div>
            <Bike size={180} className="text-zinc-800 absolute right-10 top-1/2 -translate-y-1/2 hidden md:block group-hover:text-zinc-700 transition-colors" strokeWidth={1} />
          </div>
        </Link>
      </section>

      {/* Super Ofertas */}
      <section className="bg-zinc-900 py-24 px-6 rounded-[3rem] md:rounded-[5rem] mx-4 md:mx-10 my-10">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-white leading-none">
              <span className="text-orange-500">Super</span> Ofertas
            </h3>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-80 bg-zinc-800 animate-pulse rounded-[3rem]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.length > 0 ? (
                featured.slice(0, 4).map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <ProductCard product={p as any} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-700 rounded-[3rem]">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest">Nuevas ofertas entrando al taller...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Envío Gratis */}
      <section className="container py-24 px-6">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-green-100 p-3 rounded-2xl">
            <Truck className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Envío sin cargo</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {!isLoading && freeShipping.length > 0 ? (
            freeShipping.slice(0, 4).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <ProductCard product={p as any} />
              </motion.div>
            ))
          ) : (
            <p className="col-span-full text-center text-zinc-400 py-10 font-bold uppercase tracking-widest text-sm bg-zinc-50 rounded-[2rem]">
              Consultá costos de envío por WhatsApp
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link to="/productos">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white h-20 px-16 rounded-[2.5rem] text-xl font-black uppercase tracking-tighter shadow-2xl shadow-orange-500/40 group transition-all active:scale-95">
              Ver Todo el Catálogo
              <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-3 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Banner Multimedia Dinámico */}
      {siteSettings?.home_media_url && (
        <section className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden">
          {siteSettings.home_media_type === 'video' ? (
            <video
              src={siteSettings.home_media_url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={siteSettings.home_media_url}
              alt="Banner Rafaghelli Motos"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic text-white leading-[0.85] mb-4">
                Potenciamos <br /> <span className="text-orange-500">tu viaje</span>
              </h3>
              <p className="text-zinc-300 text-lg font-medium max-w-md mx-auto">
                Taller propio · Repuestos originales · Motos en venta
              </p>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
