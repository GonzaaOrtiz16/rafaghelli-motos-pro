import { motion } from "framer-motion";

const MarqueeTicker = () => (
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
);

export default MarqueeTicker;
