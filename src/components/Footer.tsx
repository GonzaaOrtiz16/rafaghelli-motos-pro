import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Instagram, MessageCircle } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background mt-16">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Columna 1: Marca */}
        <div className="space-y-4">
          <h3 className="text-2xl font-display font-bold tracking-tighter">
            <span className="text-primary">Rafaghelli</span> Motos
          </h3>
          <p className="text-sm opacity-70 leading-relaxed">
            Repuestos seleccionados y taller especializado en Lanús. Pasión por las dos ruedas y atención personalizada de @rafaghellimotos.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="https://instagram.com/rafaghellimotos" target="_blank" className="hover:text-primary transition-colors">
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Columna 2: Categorías */}
        <div>
          <h4 className="font-bold mb-4 text-xs uppercase tracking-[0.2em] text-primary">Repuestos</h4>
          <div className="flex flex-col gap-3 text-sm opacity-70">
            <Link to="/productos?categoria=transmision" className="hover:text-primary transition-colors">Transmisión</Link>
            <Link to="/productos?categoria=frenos" className="hover:text-primary transition-colors">Frenos</Link>
            <Link to="/productos?categoria=cubiertas" className="hover:text-primary transition-colors">Cubiertas</Link>
            <Link to="/productos?categoria=aceites" className="hover:text-primary transition-colors">Aceites y Filtros</Link>
          </div>
        </div>

        {/* Columna 3: Servicios del Taller */}
        <div>
          <h4 className="font-bold mb-4 text-xs uppercase tracking-[0.2em] text-primary">El Taller</h4>
          <div className="flex flex-col gap-3 text-sm opacity-70">
            <Link to="/taller" className="hover:text-primary transition-colors font-semibold">Solicitar Turno</Link>
            <span>Service Preventivo</span>
            <span>Mecánica Integral</span>
            <span>Diagnóstico Computarizado</span>
          </div>
        </div>

        {/* Columna 4: Contacto Real */}
        <div>
          <h4 className="font-bold mb-4 text-xs uppercase tracking-[0.2em] text-primary">Contacto</h4>
          <div className="flex flex-col gap-4 text-sm">
            <a 
              href="https://goo.gl/maps/tu-link-a-google-maps" 
              target="_blank" 
              className="flex items-start gap-3 opacity-70 hover:opacity-100 transition-opacity"
            >
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span>Centenario Uruguayo 1113,<br />Lanús Este</span>
            </a>
            
            <div className="space-y-3">
              <a href="https://wa.me/54911570741745" target="_blank" className="flex items-center gap-3 group">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold opacity-50">Tienda de Repuestos</span>
                  <span className="group-hover:text-primary transition-colors">11 5707-41745</span>
                </div>
              </a>

              <a href="https://wa.me/5491171637070" target="_blank" className="flex items-center gap-3 group">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold opacity-50">Taller Mecánico</span>
                  <span className="group-hover:text-primary transition-colors">11 7163-7070</span>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-3 opacity-70 pt-2 border-t border-muted/10">
              <Clock className="h-5 w-5 text-primary" />
              <span>Lun - Vie: 9:00 - 18:30<br />Sáb: 9:00 - 14:00</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-muted/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest opacity-40">
        <span>© 2026 Rafaghelli Motos.</span>
        <span>Desarrollado por @gonzaaortiz16</span>
      </div>
    </div>
  </footer>
);

export default Footer;
