import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_process: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-zinc-200 text-zinc-700",
  refunded: "bg-zinc-200 text-zinc-700",
};

const FULFILLMENT_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "preparing", label: "Preparando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? orders : orders.filter(o => o.payment_status === filter);

  const updateFulfillment = async (orderId: string, value: string) => {
    const { error } = await supabase.from("orders").update({ fulfillment_status: value }).eq("id", orderId);
    if (error) toast.error(error.message); else { toast.success("Estado actualizado"); load(); }
  };

  const updateTracking = async (orderId: string, tracking: string) => {
    const { error } = await supabase.from("orders").update({ shipping_tracking: tracking }).eq("id", orderId);
    if (error) toast.error(error.message); else toast.success("Tracking guardado");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h2 className="text-2xl font-black uppercase italic mr-4">Órdenes</h2>
        {["all", "approved", "pending", "rejected", "cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full transition ${filter === f ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
          >
            {f === "all" ? "Todas" : f}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-xs font-bold text-orange-600 hover:underline">Actualizar</button>
      </div>

      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
      ) : filtered.length === 0 ? (
        <p className="text-center text-zinc-500 py-12">No hay órdenes {filter !== "all" ? `con estado "${filter}"` : ""}.</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="text-left p-3">Orden</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Envío</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-left p-3">Pago</th>
                  <th className="text-left p-3">Despacho</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t hover:bg-zinc-50">
                    <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3 text-xs">{new Date(o.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="p-3"><div className="font-bold">{o.buyer_name}</div><div className="text-xs text-zinc-500">{o.buyer_phone}</div></td>
                    <td className="p-3 text-xs">{o.shipping_method === "pickup" ? "🏪 Retiro" : `🚚 ${o.shipping_city || ""} (CP ${o.shipping_zip || "-"})`}</td>
                    <td className="p-3 text-right font-bold">${Number(o.total).toLocaleString("es-AR")}</td>
                    <td className="p-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[o.payment_status]}`}>{o.payment_status}</span></td>
                    <td className="p-3">
                      {o.payment_status === "approved" ? (
                        <select className="text-xs border rounded px-2 py-1 bg-white" value={o.fulfillment_status} onChange={e => updateFulfillment(o.id, e.target.value)}>
                          {FULFILLMENT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      ) : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                    <td className="p-3"><button onClick={() => setSelected(o)} className="text-orange-600 hover:text-orange-700"><Eye size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-zinc-500">Orden #{selected.id.slice(0, 8).toUpperCase()}</p>
                <h3 className="text-xl font-black">{selected.buyer_name}</h3>
                <p className="text-sm text-zinc-600">{selected.buyer_email} · {selected.buyer_phone}</p>
                {selected.buyer_dni && <p className="text-xs text-zinc-500">DNI {selected.buyer_dni}</p>}
              </div>
              <button onClick={() => setSelected(null)}><X /></button>
            </div>

            <div className="mb-4 p-4 bg-zinc-50 rounded-lg">
              <h4 className="font-bold mb-2 text-sm">Despacho</h4>
              {selected.shipping_method === "pickup" ? (
                <p className="text-sm">🏪 Retiro en local</p>
              ) : (
                <p className="text-sm">
                  🚚 <strong>Mercado Envíos</strong><br />
                  {selected.shipping_street} {selected.shipping_number}{selected.shipping_apartment ? `, ${selected.shipping_apartment}` : ""}<br />
                  {selected.shipping_city}, {selected.shipping_state} (CP {selected.shipping_zip})<br />
                  {selected.shipping_notes && <em className="text-xs text-zinc-500">Notas: {selected.shipping_notes}</em>}
                </p>
              )}
              {selected.payment_status === "approved" && selected.shipping_method === "mercado_envios" && (
                <div className="mt-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase">N° de seguimiento</label>
                  <input
                    type="text"
                    defaultValue={selected.shipping_tracking || ""}
                    placeholder="Ej: 1234567890"
                    className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    onBlur={e => e.target.value !== (selected.shipping_tracking || "") && updateTracking(selected.id, e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="font-bold mb-2 text-sm">Productos</h4>
              <div className="space-y-1 text-sm">
                {selected.order_items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between border-b pb-2">
                    <span>{it.product_title}{it.variant ? ` (${it.variant})` : ""} ×{it.quantity}</span>
                    <span className="font-bold">${Number(it.subtotal).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-sm border-t pt-3">
              <div className="flex justify-between"><span>Subtotal</span><span>${Number(selected.subtotal).toLocaleString("es-AR")}</span></div>
              <div className="flex justify-between"><span>Envío</span><span>${Number(selected.shipping_cost).toLocaleString("es-AR")}</span></div>
              <div className="flex justify-between font-black text-lg pt-1 border-t"><span>Total</span><span>${Number(selected.total).toLocaleString("es-AR")}</span></div>
            </div>

            {selected.mp_payment_id && (
              <p className="text-xs text-zinc-400 mt-3">MP Payment ID: {selected.mp_payment_id} · Tipo: {selected.mp_payment_type}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
