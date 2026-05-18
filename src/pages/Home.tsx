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
import rafaghelliLogo from "@/assets/rafaghelli-logo.png";
import bannerCuotas from "@/assets/banner-cuotas.jpg";

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
      const [{ data, error }, { data: variants, error: vErr }] = await Promise.all([
        supabase.from('products').select('id, title, slug, price, original_price, images, category, brand, free_shipping, is_on_sale, is_featured, stock').order('created_at', { ascending: false }),
        supabase.from('product_variants').select('product_id, stock'),
      ]);
      if (error) throw error;
      if (vErr) throw vErr;
      const stockMap = new Map<string, number>();
      (variants || []).forEach((v: any) => {
        stockMap.set(v.product_id, (stockMap.get(v.product_id) || 0) + (v.stock || 0));
      });
      const withStock = (data || []).map((p: any) => ({
        ...p,
        stock: (p.stock || 0) + (stockMap.get(p.id) || 0),
      }));
      withStock.sort((a: any, b: any) => {
        const aOut = (a.stock || 0) <= 0 ? 1 : 0;
        const bOut = (b.stock || 0) <= 0 ? 1 : 0;
        return aOut - bOut;
      });
      return withStock;
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
      const { data, error } = await supabase
        .from('site_settings')
        .select('home_media_url, home_media_type')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Una sola pasada por el array en lugar de 3 .filter()
  const MIN_OFERTAS = 6;
  const { featuredProducts, featured, freeShipping, recent } = useMemo(() => {
    const featuredProducts: any[] = [];
    const realOffers: any[] = [];
    const freeShipping: any[] = [];
    const inStockNonOffers: any[] = [];
    for (const p of products) {
      if ((p as any).is_featured === true) featuredProducts.push(p);
      if (p.is_on_sale === true && realOffers.length < MIN_OFERTAS) realOffers.push(p);
      else if ((p.stock || 0) > 0) inStockNonOffers.push(p);
      if (p.free_shipping === true && freeShipping.length < 4) freeShipping.push(p);
    }
    // Rellenar ofertas con productos en stock (sin descuento real: precio = precio original)
    const featured: any[] = [...realOffers];
    let i = 0;
    while (featured.length < MIN_OFERTAS && i < inStockNonOffers.length) {
      const p = inStockNonOffers[i++];
      featured.push({ ...p, original_price: p.price, is_on_sale: false });
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
      {/* Marquee Ticker - Amarillo */}
      <div className="bg-yellow-400 text-zinc-900 overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-10 py-2 text-xs font-black uppercase tracking-widest"
        >
          {[...Array(2)].map((_, idx) => (
            <span key={idx} className="flex items-center gap-10">
              <span className="flex items-center gap-2">🏍️ ENVÍO GRATIS EN COMPRAS DESDE $200.000</span>
              <span>•</span>
              <span>PAGÁ EN HASTA 12 CUOTAS CON TARJETA</span>
              <span>•</span>
              <span>ACEPTAMOS TODAS LAS TARJETAS DE CRÉDITO Y DÉBITO</span>
              <span>•</span>
              <span>SHOWROOM EN CENTENARIO URUGUAYO 1113, LANÚS 🔥</span>
              <span>•</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Hero estilo VXV - Dos banners lado a lado */}
      <section className="container px-4 md:px-6 pt-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Banner izquierdo - HOT SALE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden bg-zinc-800 group cursor-pointer"
            onClick={() => navigate('/productos')}
          >
            <img
              src="/hero-moto-street.jpg"
              alt="Hot Sale Rafaghelli"
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12">
              <span className="inline-block w-fit bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full mb-4">
                Esta semana
              </span>
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85] mb-2">
                HOT
                <br />
                <span className="text-yellow-400">RAFAGHELLI</span>
              </h2>
              <p className="text-yellow-400 font-black uppercase italic text-2xl md:text-4xl tracking-tighter mt-2">
                ¡Envíos en el día!
              </p>
              <p className="text-zinc-300 text-sm md:text-base mt-3 max-w-md font-medium">
                Comprando antes de las 12hs, el envío te llega en el día.
              </p>
            </div>
          </motion.div>

          {/* Banner derecho - Cuotas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden bg-zinc-950 group cursor-pointer"
            onClick={() => navigate('/productos')}
          >
            <img
              src={bannerCuotas}
              alt="Pagá en cuotas con tarjeta"
              loading="lazy"
              width={1280}
              height={768}
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/55 to-zinc-950/30" />
            <div className="relative z-10 h-full flex flex-col justify-center items-center p-8 md:p-12 text-center">
              <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full mb-4">
                Pagá en cuotas
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.85] drop-shadow-lg">
                HASTA <span className="text-yellow-400">12</span>
              </h2>
              <p className="font-black uppercase italic text-2xl md:text-3xl text-white tracking-tighter mt-1 drop-shadow-lg">
                Cuotas con tarjeta
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-5">
                <span className="bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full">3 CUOTAS</span>
                <span className="bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-full">6 CUOTAS</span>
                <span className="bg-yellow-400 text-zinc-900 text-xs font-black px-4 py-2 rounded-full">12 CUOTAS</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Buscador prominente debajo */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSearch}
          className="mt-6 md:hidden"
        >
          <div className="flex w-full bg-zinc-100 rounded-full border border-zinc-200">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent text-zinc-900 px-5 py-3 text-sm focus:outline-none placeholder:text-zinc-500"
            />
            <button type="submit" className="bg-yellow-400 text-zinc-900 px-6 rounded-full font-black uppercase text-xs">
              Buscar
            </button>
          </div>
        </motion.form>
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
          className="relative overflow-hidden rounded-[2.5rem] bg-zinc-700 border border-white/10 group shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 p-10 md:p-20 z-10 text-left">
              <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] uppercase bg-primary text-zinc-800 rounded-full">
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
                <Button className="bg-white text-zinc-800 hover:bg-primary hover:text-zinc-800 transition-all font-black uppercase px-10 py-7 rounded-2xl flex gap-3 items-center group/btn shadow-xl text-base tracking-tight">
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
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-zinc-700/30 to-transparent hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-700 via-transparent to-transparent md:hidden" />
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
          <div className="relative group/carousel">
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
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scrollFeatured('right')}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
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
          <Truck className="h-8 w-8 text-yellow-400" />
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
            className="relative group rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-zinc-700 shadow-2xl border-4 border-muted aspect-[9/16] md:aspect-video max-h-[85vh]"
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
            
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/80 via-transparent to-zinc-700/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-between p-4 md:p-10">
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
