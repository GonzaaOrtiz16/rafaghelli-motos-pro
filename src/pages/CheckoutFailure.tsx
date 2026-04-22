import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutFailure = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-black italic mb-2">PAGO RECHAZADO</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Tu pago no se pudo procesar. Probá con otro medio de pago o revisá los datos de tu tarjeta.
      </p>
      <div className="flex flex-col gap-2">
        <Link to="/checkout"><Button className="w-full">Reintentar</Button></Link>
        <Link to="/"><Button variant="outline" className="w-full">Volver al inicio</Button></Link>
      </div>
    </div>
  </div>
);
export default CheckoutFailure;
