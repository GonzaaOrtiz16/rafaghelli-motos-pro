import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const paymentId = params.get("payment_id") || params.get("collection_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    (async () => {
      // 1) Forzar verificación del pago en MP (fallback si el webhook no llegó)
      try {
        await supabase.functions.invoke("verify-mp-payment", {
          body: { order_id: orderId, payment_id: paymentId },
        });
      } catch (e) {
        console.error("verify-mp-payment error", e);
      }

      // 2) Leer la orden ya actualizada
      const { data } = await supabase
        .from("orders")
        .select("id, total, buyer_email, payment_status")
        .eq("id", orderId)
        .maybeSingle();
      setOrder(data);

      if (data && (data.payment_status === "approved" || data.payment_status === "in_process")) {
        clearCart();
      }
      setLoading(false);
    })();
  }, [orderId, paymentId, clearCart]);

  const status = order?.payment_status;
  const isApproved = status === "approved";
  const isPending = status === "in_process" || status === "pending";
  const isRejected = status === "rejected" || status === "cancelled";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {loading ? (
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
        ) : (
          <>
            {isApproved && <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />}
            {isPending && <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />}
            {isRejected && <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />}

            <h1 className="text-2xl font-black italic mb-2">
              {isApproved && "¡PAGO CONFIRMADO!"}
              {isPending && "PAGO EN PROCESO"}
              {isRejected && "PAGO RECHAZADO"}
              {!status && "ORDEN RECIBIDA"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">
              {isApproved && (
                <>Recibimos tu compra. Te enviamos los detalles a <strong>{order?.buyer_email || "tu email"}</strong>. Estamos preparando tu pedido.</>
              )}
              {isPending && (
                <>Tu pago está siendo procesado. Te avisaremos a <strong>{order?.buyer_email}</strong> cuando se confirme.</>
              )}
              {isRejected && (
                <>El pago no se pudo concretar. Podés volver a intentarlo desde el carrito.</>
              )}
              {!status && "Estamos verificando el estado de tu pago."}
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
