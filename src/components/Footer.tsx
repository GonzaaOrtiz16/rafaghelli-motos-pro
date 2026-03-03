import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background mt-16">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-display font-bold mb-4">
            <span className="text-primary">Rafaghelli</span> Motos
          </h3>
          <p className="text-sm opacity-70">Repuestos y taller especializado. Más de 15 años de experiencia en el rubro.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Categorías</h4>
          <div className="flex flex-col gap-2 text-sm opacity-70">
            <Link to="/productos?categoria=cascos" className="hover:text-primary transition-colors">Cascos</Link>
            <Link to="/productos?categoria=cubiertas" className="hover:text-primary transition-colors">Cubiertas</Link>
            <Link to="/productos?categoria=repuestos" className="hover:text-primary transition-colors">Repuestos</Link>
            <Link to="/productos?categoria=aceites" className="hover:text-primary transition-colors">Aceites</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Servicios</h4>
          <div className="flex flex-col gap-2 text-sm opacity-70">
            <Link to="/taller" className="hover:text-primary transition-colors">Taller Mecánico</Link>
            <span>Service Completo</span>
            <span>Cambio de Cubiertas</span>
            <span>Alineación y Balanceo</span>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Contacto</h4>
          <div className="flex flex-col gap-2 text-sm opacity-70">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Av. San Martín 1234, CABA</span>
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (011) 1234-5678</span>
            <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> info@rafaghellimotos.com</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Lun - Sáb: 9:00 - 19:00</span>
          </div>
        </div>
      </div>
      <div className="border-t border-muted/20 mt-8 pt-6 text-center text-xs opacity-50">
        © 2026 Rafaghelli Motos. Todos los derechos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
