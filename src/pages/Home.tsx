import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Search, Truck, Shield, CreditCard, ArrowRight, Bike, Zap, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useState, useRef, useEffect } from "react";
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
  const [isMuted, setIsMuted] = useState(true);
  const [currentBadge, setCurrentBadge] = useState(0); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  const badges = [
    { icon: Truck, text: "Envíos a todo el país", sub: "Llegamos donde estés" },
    { icon: Shield, text: "Calidad Garantizada", sub: "Repuestos seleccionados" },
    { icon: CreditCard, text: "Pagos Flexibles", sub: "Transferencia o Efectivo" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBadge((prev) => (prev + 1) % badges.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleToggleSound = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) videoRef.current.play().catch(() => {});
    }
  };
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

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[75vh] flex items-center">
        <motion.img
          style={{ y: heroY }}
          src="/hero-moto-street.jpg"
          alt="Moto de calle"
          className="absolute inset-0 w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
        <motion.div style={{ opacity: heroOpacity }} className="container py-16 md:py-28 px-6 relative z-10 text-primary-foreground">
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
                className="flex-1 px-5 py-4 md:py-3 rounded-2xl md:rounded-l-xl text-foreground outline-none font-bold placeholder:text-muted-foreground bg-card md:bg-transparent shadow-xl md:shadow-none"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl md:rounded-xl px-8 h-14 md:h-12 font-black uppercase tracking-tight w-full md:w-auto shadow-xl md:shadow-none min-w-[140px]">
                <Search className="h-5 w-5 mr-2 shrink-0" /> <span className="whitespace-nowrap">Buscar</span>
              </Button>
            </motion.form>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-muted/50">
        <div className="container py-8 px-6">
          <div className="md:hidden relative h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={currentBadge} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-5">
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                  {(() => { const Icon = badges[currentBadge].icon; return <Icon className="h-6 w-6 text-primary" />; })()}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-foreground">{badges[currentBadge].text}</p>
                  <p className="text-xs text-muted-foreground font-bold">{badges[currentBadge].sub}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="hidden md:grid grid-cols-3 gap-8">
            {badges.map(({ icon: Icon, text, sub }) => (
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
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/productos?categoria=${cat.nombre}`} className="group flex flex-col items-center text-center gap-4">
              <div className="relative aspect-square w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-muted border-4 border-transparent group-hover:border-primary transition-all duration-500 shadow-lg">
                <img src={cat.image || ''} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.nombre} />
              </div>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">{cat.nombre}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* SUPER OFERTAS */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="bg-foreground py-24 px-6 rounded-[3rem] md:rounded-[5rem] mx-4 md:mx-10 my-10">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-background">
              <span className="text-primary">Super</span> Ofertas
            </h3>
            <Link to="/productos" className="text-primary"><ChevronRight size={32} /></Link>
          </div>
          {/* Grilla consistente 2 cols mobile / 4 cols desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* ENVÍO GRATIS */}
      <section className="container py-24 px-6">
        <div className="flex items-center gap-4 mb-12">
          <Truck className="h-8 w-8 text-orange-500" />
          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Envío sin cargo</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
          {freeShipping.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;

