// Webhook de Mercado Pago - actualiza el estado de la orden y notifica al dueño
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mapMpPaymentStatus, sendOwnerEmail } from "../_shared/mp-order-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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

    if (!["payment", "merchant_order"].includes(topic || "") || !id) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = await resolvePaymentFromWebhook(MP_ACCESS_TOKEN, topic!, id);
    const orderId = payment.external_reference || payment.metadata?.order_id || payment.order_id;
    if (!orderId) {
      console.warn("Pago sin external_reference", payment.id);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const newStatus = mapMpPaymentStatus(payment.status);

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
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
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
        await sendOwnerEmail(order, RESEND_API_KEY);
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

async function resolvePaymentFromWebhook(token: string, topic: string, id: string) {
  if (topic === "payment") {
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payment = await payRes.json();
    if (!payRes.ok) {
      console.error("MP payment fetch error", payment);
      throw new Error("No se pudo obtener pago");
    }
    return payment;
  }

  const merchantRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const merchantOrder = await merchantRes.json();
  if (!merchantRes.ok) {
    console.error("MP merchant_order fetch error", merchantOrder);
    throw new Error("No se pudo obtener merchant_order");
  }

  const candidatePayment = [...(merchantOrder.payments || [])]
    .sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0))
    .find((p: any) => ["approved", "in_process", "pending"].includes(p.status));

  if (!candidatePayment?.id) {
    throw new Error("merchant_order sin pagos procesables");
  }

  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${candidatePayment.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payment = await payRes.json();
  if (!payRes.ok) {
    console.error("MP payment fetch error from merchant_order", payment);
    throw new Error("No se pudo obtener pago de merchant_order");
  }

  if (!payment.external_reference && merchantOrder.external_reference) {
    payment.external_reference = merchantOrder.external_reference;
  }

  return payment;
}
