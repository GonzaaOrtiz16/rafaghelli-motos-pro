import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutPending = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
      <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
      <h1 className="text-2xl font-black italic mb-2">PAGO PENDIENTE</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Tu pago está siendo procesado (puede tardar hasta 48hs si elegiste Pago Fácil o Rapipago).
        Te avisaremos por email apenas se confirme.
      </p>
      <div className="flex flex-col gap-2">
        <Link to="/mis-compras"><Button className="w-full">Ver mis compras</Button></Link>
        <Link to="/"><Button variant="outline" className="w-full">Volver al inicio</Button></Link>
      </div>
    </div>
  </div>
);
export default CheckoutPending;
