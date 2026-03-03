import { motion } from "framer-motion";
import { Wrench, Clock, Shield, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  { title: "Service Completo", desc: "Cambio de aceite, filtro, regulación de frenos, cadena y controles generales.", price: "Desde $25.000", icon: Wrench },
  { title: "Cambio de Cubiertas", desc: "Desmontaje, montaje, balanceo y alineación. Cubiertas no incluidas.", price: "Desde $8.000", icon: CheckCircle },
  { title: "Reparación de Motor", desc: "Diagnóstico completo, rectificación y armado de motor. Presupuesto sin cargo.", price: "Consultar", icon: Shield },
  { title: "Electricidad y Encendido", desc: "Diagnóstico y reparación del sistema eléctrico, bobinas, CDI, regulador.", price: "Desde $12.000", icon: Clock },
];

const whatsappLink = "https://wa.me/5491112345678?text=Hola!%20Quiero%20agendar%20un%20turno%20en%20el%20taller";

const Workshop = () => (
  <div>
    {/* Hero */}
    <section className="bg-gradient-to-br from-foreground to-foreground/90 text-background">
      <div className="container py-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Wrench className="h-4 w-4" /> Taller Especializado
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight mb-4">
            Tu moto en las <span className="text-primary">mejores manos</span>
          </h1>
          <p className="text-lg opacity-80 mb-6">Mecánicos certificados con más de 15 años de experiencia. Trabajamos con todas las marcas.</p>
          <Button variant="whatsapp" size="lg" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5 mr-2" /> Agendar Turno por WhatsApp
            </a>
          </Button>
        </motion.div>
      </div>
    </section>

    {/* Services */}
    <section className="container py-12">
      <h2 className="text-2xl font-display font-bold mb-8 text-center">Nuestros Servicios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                <p className="text-sm font-semibold text-primary">{s.price}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary">
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-display font-bold text-primary-foreground mb-3">¿Necesitás un turno?</h2>
        <p className="text-primary-foreground/80 mb-6">Contactanos por WhatsApp y coordinamos día y horario.</p>
        <Button variant="secondary" size="lg" asChild>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5 mr-2" /> Escribinos por WhatsApp
          </a>
        </Button>
      </div>
    </section>
  </div>
);

export default Workshop;
