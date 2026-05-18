import { motion } from "framer-motion";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import bannerCuotas from "@/assets/banner-cuotas.jpg";

const HeroBanners = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/productos?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="container px-4 md:px-6 pt-6 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden bg-zinc-800 group cursor-pointer"
          onClick={() => navigate("/productos")}
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

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden bg-zinc-950 group cursor-pointer"
          onClick={() => navigate("/productos")}
        >
          <img
            src={bannerCuotas}
            alt="Pagá en cuotas con tarjeta"
            loading="eager"
            fetchPriority="high"
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
            onChange={(e) => setQ(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="flex-1 bg-transparent text-zinc-900 px-5 py-3 text-sm focus:outline-none placeholder:text-zinc-500"
          />
          <button type="submit" className="bg-yellow-400 text-zinc-900 px-6 rounded-full font-black uppercase text-xs">
            Buscar
          </button>
        </div>
      </motion.form>
    </section>
  );
};

export default HeroBanners;
