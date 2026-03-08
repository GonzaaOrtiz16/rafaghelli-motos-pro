import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Truck, Shield, CreditCard, ArrowRight, Bike, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const fadeRight = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Home = () => {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categorias', 'repuestos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('*').eq('tipo', 'repuestos').order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Marquee Ticker */}
      <div className="bg-primary text-primary-foreground overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-8 py-2 text-xs font-black uppercase tracking-widest"
        >
          {[...Array(2)].map((_, idx) => (
            <span key={idx} className="flex items-center gap-8">
              <span className="flex items-center gap-2"><Zap size={12} /> Envíos a todo el país</span>
              <span>•</span>
              <span className="flex items-center gap-2"><Shield size={12} /> Calidad garantizada</span>
              <span>•</span>
              <span className="flex items-center gap-2"><CreditCard size={12} /> Transferencia y efectivo</span>
              <span>•</span>
              <span className="flex items-center gap-2"><Truck size={12} /> Envío gratis en productos seleccionados</span>
              <span>•</span>
              <span>Repuestos originales y accesorios premium</span>
              <span>•</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[70vh] flex items-center">
        <motion.img
          style={{ y: heroY }}
          src="/hero-moto-street.jpg"
          alt="Moto de calle haciendo wheelie en la ciudad"
          className="absolute inset-0 w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <motion.div style={{ opacity: heroOpacity }} className="container py-16 md:py-28 px-6 relative z-10 text-primary-foreground">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.h2 variants={fadeRight} className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              Rafaghelli <span className="text-primary">Motos</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-lg md:text-xl mb-10 font-medium max-w-xl">
              Repuestos originales y accesorios premium. Potenciamos tu viaje con la garantía de @rafaghellimotos.
            </motion.p>
            
            <motion.form variants={fadeUp} onSubmit={handleSearch} className="flex max-w-lg bg-card rounded-2xl p-1.5 shadow-2xl">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscá por marca o repuesto..."
                className="flex-1 px-5 py-3 rounded-l-xl text-foreground outline-none font-bold placeholder:text-muted-foreground bg-transparent"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 font-black uppercase tracking-tight">
                <Search className="h-5 w-5 mr-2" /> Buscar
              </Button>
            </motion.form>
          </motion.div>
        </motion.div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent hidden md:block" />
      </section>

      {/* Trust Badges - animated on scroll */}
      <section className="border-b bg-muted/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="container py-8 px-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, text: "Envíos a todo el país", sub: "Llegamos donde estés" },
              { icon: Shield, text: "Calidad Garantizada", sub: "Repuestos seleccionados" },
              { icon: CreditCard, text: "Pagos Flexibles", sub: "Transferencia o Efectivo" },
            ].map(({ icon: Icon, text, sub }) => (
              <motion.div key={text} variants={fadeUp} className="flex items-center gap-5 group">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-card p-4 rounded-2xl shadow-sm border border-border group-hover:bg-primary transition-colors duration-300"
                >
                  <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </motion.div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-foreground">{text}</p>
                  <p className="text-xs text-muted-foreground font-bold">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Categorías Dinámicas */}
      <section className="container py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-12">
            <div>
              <span className="text-primary font-black uppercase text-xs tracking-[0.2em]">Explorar</span>
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Categorías</h3>
            </div>
            <Link to="/productos" className="bg-muted hover:bg-muted/80 p-3 rounded-full transition-colors">
              <ArrowRight className="h-5 w-5 text-foreground" />
            </Link>
          </motion.div>
          
          {categories.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} variants={scaleIn} custom={i}>
                  <Link to={`/productos?categoria=${cat.nombre}`} className="group flex flex-col items-center text-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden bg-muted border-4 border-transparent group-hover:border-primary transition-all duration-500 shadow-lg"
                    >
                      {cat.image ? (
                        <img src={cat.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.nombre} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary text-muted-foreground font-black uppercase text-xs">{cat.nombre[0]}</div>
                      )}
                      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-transparent transition-colors" />
                    </motion.div>
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">{cat.nombre}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-border rounded-[3rem]">
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Creá categorías desde el panel Admin</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Banner Motos en Venta */}
      <section className="mx-4 md:mx-10 my-10">
        <Link to="/motos" className="block group">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={scaleIn}
            whileHover={{ scale: 1.01 }}
            className="bg-foreground rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 flex items-center justify-between overflow-hidden relative"
          >
            <div className="relative z-10">
              <motion.span variants={fadeUp} className="text-primary font-black uppercase text-[10px] tracking-[0.3em]">Nueva Sección</motion.span>
              <motion.h3 variants={fadeRight} className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-background leading-none mt-2">
                Motos en <span className="text-primary">Venta</span>
              </motion.h3>
              <motion.p variants={fadeUp} className="text-muted-foreground font-medium mt-3 max-w-md">0km y usadas seleccionadas con garantía Rafaghelli.</motion.p>
              <motion.div variants={fadeUp} className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-tighter text-sm transition-all group-hover:gap-4">
                Ver Motos <ArrowRight size={18} />
              </motion.div>
            </div>
            <motion.div
              animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bike size={180} className="text-muted/20 absolute right-10 top-1/2 -translate-y-1/2 hidden md:block" strokeWidth={1} />
            </motion.div>
          </motion.div>
        </Link>
      </section>

      {/* Super Ofertas */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
        className="bg-foreground py-24 px-6 rounded-[3rem] md:rounded-[5rem] mx-4 md:mx-10 my-10"
      >
        <div className="container">
          <motion.div variants={fadeRight} className="flex items-center justify-between mb-12">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-background leading-none">
              <span className="text-primary">Super</span> Ofertas
            </h3>
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Link to="/productos" className="text-primary">
                <ChevronRight size={32} />
              </Link>
            </motion.div>
          </motion.div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <motion.div key={n} variants={fadeUp} className="h-80 bg-muted/20 animate-pulse rounded-[3rem]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.length > 0 ? (
                featured.slice(0, 4).map((p, i) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <ProductCard product={p as any} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-muted/30 rounded-[3rem]">
                  <p className="text-muted-foreground font-bold uppercase tracking-widest">Nuevas ofertas entrando al taller...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* Envío Gratis */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={stagger}
        className="container py-24 px-6"
      >
        <motion.div variants={fadeRight} className="flex items-center gap-4 mb-12">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-success/10 p-3 rounded-2xl"
          >
            <Truck className="h-8 w-8 text-success" />
          </motion.div>
          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Envío sin cargo</h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {!isLoading && freeShipping.length > 0 ? (
            freeShipping.slice(0, 4).map((p, i) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard product={p as any} />
              </motion.div>
            ))
          ) : (
            <motion.p variants={fadeUp} className="col-span-full text-center text-muted-foreground py-10 font-bold uppercase tracking-widest text-sm bg-muted rounded-[2rem]">
              Consultá costos de envío por WhatsApp
            </motion.p>
          )}
        </div>

        <motion.div variants={scaleIn} className="flex flex-col items-center gap-6">
          <Link to="/productos">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-20 px-16 rounded-[2.5rem] text-xl font-black uppercase tracking-tighter shadow-2xl shadow-primary/40 group transition-all">
                Ver Todo el Catálogo
                <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-3 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.section>

      {/* Banner Multimedia Dinámico */}
      {siteSettings?.home_media_url && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden"
        >
          {siteSettings.home_media_type === 'video' ? (
            <video src={siteSettings.home_media_url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <img src={siteSettings.home_media_url} alt="Banner Rafaghelli Motos" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic text-primary-foreground leading-[0.85] mb-4">
                Potenciamos <br /> <span className="text-primary">tu viaje</span>
              </h3>
              <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto">
                Taller propio · Repuestos originales · Motos en venta
              </p>
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
