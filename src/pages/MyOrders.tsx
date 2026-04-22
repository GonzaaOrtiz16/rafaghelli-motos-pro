import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  in_process: { label: "Procesando", color: "bg-blue-100 text-blue-700" },
  approved: { label: "Aprobado", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", color: "bg-zinc-200 text-zinc-700" },
  refunded: { label: "Devuelto", color: "bg-zinc-200 text-zinc-700" },
};

const FULFILL_LABEL: Record<string, string> = {
  pending: "Esperando despacho",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const MyOrders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .in("payment_status", ["approved", "in_process", "rejected", "refunded"])
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <h1 className="text-3xl font-black italic mb-8">MIS COMPRAS</h1>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">Todavía no realizaste ninguna compra</p>
          <Link to="/productos" className="text-primary font-bold hover:underline">Explorar productos</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const st = STATUS_LABEL[o.payment_status] || STATUS_LABEL.pending;
            return (
              <div key={o.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Orden #{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm">{new Date(o.created_at).toLocaleString("es-AR")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    {o.payment_status === "approved" && (
                      <span className="text-xs text-muted-foreground">{FULFILL_LABEL[o.fulfillment_status] || ""}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-3 text-sm">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between">
                      <span>{it.product_title} ×{it.quantity}</span>
                      <span className="font-semibold">${Number(it.subtotal).toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-end">
                  <div className="text-xs text-muted-foreground">
                    {o.shipping_method === "pickup" ? "🏪 Retiro en local" : `🚚 Mercado Envíos · CP ${o.shipping_zip}`}
                    {o.shipping_tracking && <p className="font-mono mt-1">Tracking: {o.shipping_tracking}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-black text-lg">${Number(o.total).toLocaleString("es-AR")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyOrders;
