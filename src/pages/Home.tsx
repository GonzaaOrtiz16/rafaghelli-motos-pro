import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Truck, Shield, CreditCard, ArrowRight, Zap, ChevronRight, ChevronLeft, Volume2, VolumeX, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import CategoryGrid from "@/components/CategoryGrid";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const fadeRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const BADGES = [
  { icon: Truck, text: "Envíos a todo el país", sub: "Llegamos donde estés" },
  { icon: Shield, text: "Calidad Garantizada", sub: "Repuestos seleccionados" },
  { icon: CreditCard, text: "Pagos Flexibles", sub: "Transferencia o Efectivo" },
];

const Home = () => {
  const [q, setQ] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [currentBadge, setCurrentBadge] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBadge((prev) => (prev + 1) % BADGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) videoRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const { data: products = [] } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, title, slug, price, original_price, images, category, brand, free_shipping, is_on_sale, is_featured').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categorias', 'repuestos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categorias').select('id, nombre, image').eq('tipo', 'repuestos').order('nombre');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('home_media_url, home_media_type').limit(1).single();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Una sola pasada por el array en lugar de 3 .filter()
  const { featuredProducts, featured, freeShipping, recent } = useMemo(() => {
    const featuredProducts: any[] = [];
    const featured: any[] = [];
    const freeShipping: any[] = [];
    for (const p of products) {
      if ((p as any).is_featured === true) featuredProducts.push(p);
      if (p.is_on_sale === true && featured.length < 4) featured.push(p);
      if (p.free_shipping === true && freeShipping.length < 4) freeShipping.push(p);
    }
    return { featuredProducts, featured, freeShipping, recent: products.slice(0, 8) };
  }, [products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/productos?q=${encodeURIComponent(q)}`);
  };

  const scrollFeatured = useCallback((dir: 'left' | 'right') => {
    const el = document.getElementById('featured-scroll');
    if (el) el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  }, []);

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

      {/* Hero Section - sin parallax (mejor performance) */}
      <section className="relative overflow-hidden min-h-[75vh] flex items-center">
        <img
          src="/hero-moto-street.jpg"
          alt="Moto de calle"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <div className="container py-16 md:py-28 px-6 relative z-10 text-primary-foreground">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">
            <motion.h2 variants={fadeRight} className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
              Rafaghelli <span className="text-primary">Motos</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 text-lg md:text-xl mb-10 font-medium max-w-xl">
              Repuestos originales y accesorios premium. Potenciamos tu viaje con la garantía de @rafaghellimotos.
            </motion.p>

            <motion.form variants={fadeUp} onSubmit={handleSearch} className="flex flex-col md:flex-row w-full max-w-lg bg-transparent md:bg-card rounded-2xl md:p-1.5 md:shadow-2xl gap-3 md:gap-0">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscá por marca o repuesto..."
                className="flex-1 px-5 py-4 md:py-3 rounded-2xl md:rounded-l-xl text-foreground outline-none font-bold placeholder:text-muted-foreground bg-card md:bg-transparent"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl md:rounded-xl px-8 h-14 md:h-12 font-black uppercase tracking-tight w-full md:w-auto">
                <Search className="h-5 w-5 mr-2 shrink-0" /> <span className="whitespace-nowrap">Buscar</span>
              </Button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-muted/50">
        <div className="container py-8 px-6">
          <div className="md:hidden relative h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={currentBadge} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-5">
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                  {(() => { const Icon = BADGES[currentBadge].icon; return <Icon className="h-6 w-6 text-primary" />; })()}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-foreground">{BADGES[currentBadge].text}</p>
                  <p className="text-xs text-muted-foreground font-bold">{BADGES[currentBadge].sub}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-8">
            {BADGES.map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-5 group">
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border group-hover:bg-primary transition-colors">
                  <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-foreground">{text}</p>
                  <p className="text-xs text-muted-foreground font-bold">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container py-20 px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-primary font-black uppercase text-xs tracking-[0.2em]">Explorar</span>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Categorías</h3>
          </div>
        </div>
        <CategoryGrid categories={categories} />
      </section>

      {/* SECCIÓN PRÓXIMA MOTO (RECUPERADA) */}
      <section className="container py-12 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/10 group shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 p-10 md:p-20 z-10 text-left">
              <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] uppercase bg-primary text-black rounded-full">
                Unidades Seleccionadas
              </span>
              <h3 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
                Encontrá tu <br />
                <span className="text-primary italic">Próxima Moto</span>
              </h3>
              <p className="text-zinc-400 text-lg mb-10 max-w-sm font-medium">
                Revisá nuestro catálogo de motos usadas y 0km con la garantía de confianza Rafaghelli.
              </p>
              <Link to="/motos">
                <Button className="bg-white text-black hover:bg-primary hover:text-black transition-all font-black uppercase px-10 py-7 rounded-2xl flex gap-3 items-center group/btn shadow-xl text-base tracking-tight">
                  Ver catálogo
                  <ArrowRight className="group-hover/btn:translate-x-2 transition-transform h-6 w-6 text-primary" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 relative h-[350px] md:h-[600px] w-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1558981403-c5f91cbba527?q=80&w=2070&auto=format&fit=crop" 
                alt="Motos en venta"
                className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/30 to-transparent hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:hidden" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* PRODUCTOS DESTACADOS - Carrusel infinito */}
      {featuredProducts.length > 0 && (
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="py-24">
          <div className="container px-4 md:px-6 flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-500" fill="currentColor" />
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Destacados</h3>
            </div>
            <Link to="/productos" className="text-primary"><ChevronRight size={32} /></Link>
          </div>
          <div className="relative group">
            <div
              id="featured-scroll"
              className="overflow-x-auto scrollbar-hide scroll-smooth"
            >
              <div className="flex gap-4 md:gap-8 px-4 md:px-6 w-max">
                {featuredProducts.map((p) => (
                  <div key={p.id} className="w-[45vw] md:w-[280px] lg:w-[300px] shrink-0">
                    <ProductCard product={p as any} />
                  </div>
                ))}
              </div>
            </div>
            {/* Flechas PC */}
            <button
              onClick={() => scrollFeatured('left')}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scrollFeatured('right')}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.section>
      )}

      {/* SUPER OFERTAS */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="bg-foreground py-24 px-4 md:px-6 rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-10 my-10">
        <div className="container max-w-[1300px]">
          <div className="flex items-center justify-between mb-12 px-2">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-background">
              <span className="text-primary">Super</span> Ofertas
            </h3>
            <Link to="/productos" className="text-primary"><ChevronRight size={32} /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
            {featured.map((p) => (
              <div key={p.id} className="w-full">
                <ProductCard product={p as any} />
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ENVÍO GRATIS */}
      <section className="container py-24 px-4 md:px-6">
        <div className="flex items-center gap-4 mb-12">
          <Truck className="h-8 w-8 text-orange-500" />
          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Envío sin cargo</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 mb-20">
          {freeShipping.map((p) => (
            <div key={p.id} className="w-full">
              <ProductCard product={p as any} />
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTOS RECIENTES */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="container py-24 px-4 md:px-6">
        <div className="flex items-center justify-between mb-12 px-2">
          <div>
            <span className="text-primary font-black uppercase text-xs tracking-[0.2em]">Catálogo</span>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
              Todos los <span className="text-primary">Productos</span>
            </h3>
          </div>
          <Link to="/productos" className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-tight hover:underline">
            Ver todos <ChevronRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
          {recent.map((p) => (
            <div key={p.id} className="w-full">
              <ProductCard product={p as any} />
            </div>
          ))}
        </div>
      </motion.section>

      {/* VIDEO FINAL */}
      {siteSettings?.home_media_url && (
        <section className="pb-24 px-2 md:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative group rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-black shadow-2xl border-4 border-muted aspect-[9/16] md:aspect-video max-h-[85vh]"
          >
            <video
              key={siteSettings.home_media_url}
              ref={videoRef}
              src={siteSettings.home_media_url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="none"
            />
            <div className="absolute top-6 left-6 md:top-12 md:left-12 z-20 pointer-events-none">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
                <h4 className="text-white text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2 drop-shadow-lg">
                  SENTÍ LA <span className="text-primary">POTENCIA</span>
                </h4>
                <p className="text-zinc-200 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] drop-shadow-md">
                  Equipamiento premium para pilotos exigentes
                </p>
                <div className="w-12 h-1 bg-primary mt-4 rounded-full" />
              </motion.div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-between p-4 md:p-10">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md h-10 w-10 md:h-12 md:w-12"
                  onClick={handleToggleSound}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
              </div>
              <Link to="/productos">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-full px-5 md:px-8 h-10 md:h-12 text-xs md:text-sm shadow-xl">
                  Explorar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default Home;
