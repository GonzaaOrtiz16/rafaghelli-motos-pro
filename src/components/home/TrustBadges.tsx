import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Shield, CreditCard } from "lucide-react";

const BADGES = [
  { icon: Truck, text: "Envíos a todo el país", sub: "Llegamos donde estés" },
  { icon: Shield, text: "Calidad Garantizada", sub: "Repuestos seleccionados" },
  { icon: CreditCard, text: "Pagos Flexibles", sub: "Transferencia o Efectivo" },
];

const TrustBadges = () => {
  const [currentBadge, setCurrentBadge] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBadge((prev) => (prev + 1) % BADGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="border-b bg-muted/50">
      <div className="container py-8 px-6">
        <div className="md:hidden relative h-24 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBadge}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-5"
            >
              <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                {(() => {
                  const Icon = BADGES[currentBadge].icon;
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-foreground">
                  {BADGES[currentBadge].text}
                </p>
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
  );
};

export default TrustBadges;
