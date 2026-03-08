import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Gauge, ArrowLeft, MessageCircle } from "lucide-react";

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const Motos = () => {
  const { data: motos = [], isLoading } = useQuery({
    queryKey: ["public-motorcycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motorcycles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-zinc-900 py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent hidden md:block" />
        <div className="container relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 font-black uppercase text-[10px] tracking-widest mb-8 transition-all">
            <ArrowLeft size={14} /> Inicio
          </Link>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white italic">
            Motos <span className="text-orange-500">en Venta</span>
          </h1>
          <p className="text-zinc-400 text-lg mt-4 max-w-xl font-medium">
            0km y usadas seleccionadas. Todas con garantía Rafaghelli.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="container py-16 px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[500px] bg-zinc-100 animate-pulse rounded-[3rem]" />
            ))}
          </div>
        ) : motos.length === 0 ? (
          <div className="text-center py-24 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">
              Próximamente nuevas unidades...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {motos.map((moto, i) => (
              <motion.div
                key={moto.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase shadow-lg ${moto.kilometers === 0 ? "bg-orange-500 text-white" : "bg-zinc-900 text-white"}`}>
                      {moto.kilometers === 0 ? "0KM" : "Usada"}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-100 relative">
                    <img
                      src={moto.images?.[0] || "/placeholder.svg"}
                      alt={moto.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-3">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic">
                      {moto.brand}
                    </p>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter leading-tight line-clamp-2 text-zinc-900">
                      {moto.title}
                    </h3>

                    <div className="flex items-center gap-4 text-zinc-400">
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
                      <p className="text-2xl font-black text-zinc-900 italic tracking-tighter">
                        {formatPrice(moto.price)}
                      </p>
                      <a
                        href={`https://wa.me/5491157074145?text=${encodeURIComponent(`Hola! Me interesa la moto: ${moto.title} (${moto.year})`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-2xl transition-all active:scale-95"
                      >
                        <MessageCircle size={20} />
                      </a>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Motos;
