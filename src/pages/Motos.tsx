import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Gauge, ArrowLeft, MessageCircle, Eye, Bike, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

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

const Motos = () => {
  const [conditionFilter, setConditionFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");

  const { data: motos = [], isLoading } = useQuery({
    queryKey: ["public-motorcycles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("motorcycles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const dynamicBrands = useMemo(() => {
    const set = new Set(motos.map(m => m.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [motos]);

  const filtered = useMemo(() => {
    return motos.filter(m => {
      if (conditionFilter && m.condition !== conditionFilter) return false;
      if (brandFilter && m.brand !== brandFilter) return false;
      return true;
    });
  }, [motos, conditionFilter, brandFilter]);

  const hasFilters = !!(conditionFilter || brandFilter);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero */}
      <section className="bg-foreground py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent hidden md:block" />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block"
        >
          <Bike size={220} className="text-muted/10" strokeWidth={0.8} />
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="container relative z-10"
        >
          <motion.div variants={fadeUp}>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-black uppercase text-[10px] tracking-widest mb-8 transition-all">
              <ArrowLeft size={14} /> Inicio
            </Link>
          </motion.div>
          <motion.h1 variants={fadeRight} className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-background italic">
            Motos <span className="text-primary">en Venta</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg mt-4 max-w-xl font-medium">
            0km y usadas seleccionadas. Todas con garantía Rafaghelli.
          </motion.p>
        </motion.div>
      </section>

      {/* Filtros rápidos */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="container px-6 pt-10"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-muted-foreground mr-2">
            <Filter size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Filtrar:</span>
          </div>
          {["Nueva", "Usada"].map(c => (
            <motion.button
              key={c}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setConditionFilter(conditionFilter === c ? "" : c)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-colors ${conditionFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {c === "Nueva" ? "0KM" : "Usadas"}
            </motion.button>
          ))}
          {dynamicBrands.map(b => (
            <motion.button
              key={b}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBrandFilter(brandFilter === b ? "" : b)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-colors ${brandFilter === b ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {b}
            </motion.button>
          ))}
          <AnimatePresence>
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { setConditionFilter(""); setBrandFilter(""); }}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight text-destructive hover:bg-destructive/10 transition-colors"
              >
                Limpiar
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Grid */}
      <section className="container py-10 px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <motion.div
                key={n}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: n * 0.1 }}
                className="h-[500px] bg-muted animate-pulse rounded-[3rem]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-muted rounded-[3rem] border-2 border-dashed border-border"
          >
            <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">
              {hasFilters ? "No hay motos con esos filtros" : "Próximamente nuevas unidades..."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((moto) => (
                <motion.div
                  key={moto.id}
                  variants={fadeUp}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                >
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group bg-card rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-shadow duration-500 relative"
                  >
                    {/* Badge */}
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="absolute top-4 left-4 z-10"
                    >
                      <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase shadow-lg ${moto.kilometers === 0 ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}>
                        {moto.kilometers === 0 ? "0KM" : "Usada"}
                      </span>
                    </motion.div>

                    {/* Image */}
                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                      <img
                        src={moto.images?.[0] || "/placeholder.svg"}
                        alt={moto.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                          <Eye size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 space-y-3">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">
                        {moto.brand}
                      </p>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter leading-tight line-clamp-2 text-foreground">
                        {moto.title}
                      </h3>

                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span className="text-xs font-black">{moto.year}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge size={14} />
                          <span className="text-xs font-black">
                            {moto.kilometers === 0 ? "0 km" : `${moto.kilometers.toLocaleString("es-AR")} km`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-2xl font-black text-foreground italic tracking-tighter">
                          {formatPrice(moto.price)}
                        </p>
                        <motion.a
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          href={`https://wa.me/5491157074145?text=${encodeURIComponent(`Hola! Me interesa la moto: ${moto.title} (${moto.year})`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-2xl transition-colors"
                        >
                          <MessageCircle size={20} />
                        </motion.a>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default Motos;
