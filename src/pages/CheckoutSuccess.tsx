import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("orders").select("id, total, buyer_email, payment_status").eq("id", orderId).maybeSingle();
      setOrder(data);
      setLoading(false);
    })();
  }, [orderId]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {loading ? (
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        ) : (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-black italic mb-2">¡PAGO CONFIRMADO!</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Recibimos tu compra. Te enviamos los detalles a <strong>{order?.buyer_email || "tu email"}</strong>.
              Estamos preparando tu pedido.
            </p>
            {order?.id && (
              <p className="text-xs text-muted-foreground mb-6">
                Orden #{order.id.slice(0, 8).toUpperCase()}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Link to="/mis-compras"><Button className="w-full">Ver mis compras</Button></Link>
              <Link to="/productos"><Button variant="outline" className="w-full">Seguir comprando</Button></Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default CheckoutSuccess;
