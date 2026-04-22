// Webhook de Mercado Pago - actualiza el estado de la orden y notifica al dueño
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFY_EMAIL = "gonzaaortiz16@gmail.com"; // destinatario fijo (cambiar cuando haya dominio)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Body o query params (MP manda de las 2 formas)
    const url = new URL(req.url);
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const topic = payload.type || payload.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const id = payload.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");

    console.log("MP webhook", { topic, id, payload });

    if (topic !== "payment" || !id) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener detalles del pago
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await payRes.json();
    if (!payRes.ok) {
      console.error("MP payment fetch error", payment);
      throw new Error("No se pudo obtener pago");
    }

    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) {
      console.warn("Pago sin external_reference", payment.id);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Mapear status MP -> nuestro
    const statusMap: Record<string, string> = {
      approved: "approved",
      pending: "pending",
      in_process: "in_process",
      rejected: "rejected",
      cancelled: "cancelled",
      refunded: "refunded",
      charged_back: "refunded",
    };
    const newStatus = statusMap[payment.status] || "pending";

    const shippingCost = payment.shipping_amount || 0;
    const total = payment.transaction_amount || 0;

    // Update orden (el trigger se encarga de descontar stock si pasa a approved)
    const { data: prevOrder } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .maybeSingle();

    await supabase
      .from("orders")
      .update({
        payment_status: newStatus,
        mp_payment_id: String(payment.id),
        mp_payment_type: payment.payment_type_id,
        shipping_cost: shippingCost,
        total: total,
      })
      .eq("id", orderId);

    // Si se aprobó (y no estaba ya aprobada), notificar al dueño
    if (newStatus === "approved" && prevOrder?.payment_status !== "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (order && RESEND_API_KEY) {
        await sendOwnerEmail(order, RESEND_API_KEY, LOVABLE_API_KEY);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("mp-webhook error:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function sendOwnerEmail(order: any, resendKey: string, lovableKey?: string) {
  try {
    const itemsHtml = (order.order_items || [])
      .map(
        (i: any) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_title}${i.variant ? ` (${i.variant})` : ""}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${Number(i.subtotal).toLocaleString("es-AR")}</td></tr>`,
      )
      .join("");

    const shippingBlock =
      order.shipping_method === "pickup"
        ? `<p><strong>Entrega:</strong> 🏪 Retiro por el local</p>`
        : `<p><strong>Dirección de envío:</strong><br>
            ${order.shipping_street} ${order.shipping_number}${order.shipping_apartment ? `, ${order.shipping_apartment}` : ""}<br>
            ${order.shipping_city}, ${order.shipping_state} (CP ${order.shipping_zip})<br>
            ${order.shipping_notes ? `<em>Notas: ${order.shipping_notes}</em>` : ""}
           </p>
           <p><strong>Envío:</strong> 🚚 Mercado Envíos – $${Number(order.shipping_cost).toLocaleString("es-AR")}</p>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fff">
        <div style="background:#f97316;color:#fff;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:22px">🏍️ NUEVA VENTA – RAFAGHELLI MOTOS</h1>
        </div>
        <div style="border:1px solid #eee;border-top:none;padding:20px;border-radius:0 0 8px 8px">
          <p><strong>Orden #:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString("es-AR")}</p>

          <h2 style="font-size:16px;margin-top:20px;border-bottom:2px solid #f97316;padding-bottom:6px">Cliente</h2>
          <p>
            <strong>${order.buyer_name}</strong><br>
            📧 ${order.buyer_email}<br>
            📱 ${order.buyer_phone}<br>
            ${order.buyer_dni ? `🆔 DNI ${order.buyer_dni}` : ""}
          </p>

          <h2 style="font-size:16px;margin-top:20px;border-bottom:2px solid #f97316;padding-bottom:6px">Despacho</h2>
          ${shippingBlock}

          <h2 style="font-size:16px;margin-top:20px;border-bottom:2px solid #f97316;padding-bottom:6px">Productos</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#fafafa">
              <th style="padding:8px;text-align:left">Producto</th>
              <th style="padding:8px;text-align:center">Cant.</th>
              <th style="padding:8px;text-align:right">Subtotal</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <table style="width:100%;margin-top:16px;font-size:14px">
            <tr><td>Subtotal:</td><td style="text-align:right">$${Number(order.subtotal).toLocaleString("es-AR")}</td></tr>
            <tr><td>Envío:</td><td style="text-align:right">$${Number(order.shipping_cost).toLocaleString("es-AR")}</td></tr>
            <tr style="font-weight:bold;font-size:16px;color:#f97316">
              <td style="padding-top:8px;border-top:2px solid #f97316">TOTAL COBRADO:</td>
              <td style="padding-top:8px;border-top:2px solid #f97316;text-align:right">$${Number(order.total).toLocaleString("es-AR")}</td>
            </tr>
          </table>

          <p style="margin-top:24px;padding:12px;background:#f0fdf4;border-left:4px solid #22c55e;font-size:13px">
            ✅ Pago aprobado por Mercado Pago (ID: ${order.mp_payment_id})<br>
            El stock ya fue descontado automáticamente.
          </p>

          <p style="font-size:12px;color:#888;margin-top:20px">
            Ingresá al panel de admin para gestionar esta orden:<br>
            <a href="https://rafaghellimotos.lovable.app/admin" style="color:#f97316">Abrir panel</a>
          </p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Rafaghelli Motos <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: `🏍️ Nueva venta #${order.id.slice(0, 8).toUpperCase()} – $${Number(order.total).toLocaleString("es-AR")}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("Resend error", await res.text());
    } else {
      console.log("Email enviado a", NOTIFY_EMAIL);
    }
  } catch (e) {
    console.error("sendOwnerEmail error", e);
  }
}
