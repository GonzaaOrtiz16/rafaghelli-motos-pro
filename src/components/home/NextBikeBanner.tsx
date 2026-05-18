import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const NextBikeBanner = () => (
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
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 via-zinc-700/30 to-transparent hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-700 via-transparent to-transparent md:hidden" />
        </div>
      </div>
    </motion.div>
  </section>
);

export default NextBikeBanner;
