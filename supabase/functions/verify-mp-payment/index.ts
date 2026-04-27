// Verifica el estado real de un pago en MP y actualiza la orden.
// Fallback por si el webhook no llegó. Llamado desde la página de éxito.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { mapMpPaymentStatus, sendOwnerEmail, sendBuyerEmail } from "../_shared/mp-order-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { order_id, payment_id } = await req.json();
    if (!order_id) throw new Error("order_id requerido");

    // Buscar pago: primero por payment_id si vino, sino por external_reference
    let payment: any = null;

    if (payment_id) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      });
      if (r.ok) payment = await r.json();
    }

    if (!payment) {
      // Buscar por external_reference (último pago asociado a esta orden)
      const r = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${order_id}&sort=date_created&criteria=desc`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } },
      );
      const data = await r.json();
      if (r.ok && data.results?.length) payment = data.results[0];
    }

    if (!payment) {
      return new Response(JSON.stringify({ ok: true, found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const newStatus = mapMpPaymentStatus(payment.status);
    const total = payment.transaction_amount || 0;

    // Update solo si el estado cambió o no se había guardado el payment_id
    const { data: prev } = await supabase
      .from("orders")
      .select("payment_status, mp_payment_id")
      .eq("id", order_id)
      .maybeSingle();

    if (!prev) {
      return new Response(JSON.stringify({ ok: false, error: "orden no encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    await supabase
      .from("orders")
      .update({
        payment_status: newStatus,
        mp_payment_id: String(payment.id),
        mp_payment_type: payment.payment_type_id,
        total: total || undefined,
        approved_at: newStatus === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", order_id);

    if (newStatus === "approved" && prev.payment_status !== "approved" && RESEND_API_KEY) {
      const { data: order } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", order_id)
        .single();

      if (order) {
        await sendOwnerEmail(order, RESEND_API_KEY);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, status: newStatus, payment_id: payment.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-mp-payment error:", err);
    const msg = err instanceof Error ? err.message : "Error";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
