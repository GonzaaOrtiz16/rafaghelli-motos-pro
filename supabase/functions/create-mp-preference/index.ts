// Crea una preferencia de Mercado Pago Checkout Pro
// Modo TEST: usa MP_ACCESS_TOKEN de sandbox
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  product_id: string;
  title: string;
  image?: string;
  variant?: string;
  quantity: number;
  unit_price: number;
}

interface BodyShape {
  items: CartItem[];
  buyer: {
    name: string;
    dni?: string;
    email: string;
    phone: string;
  };
  shipping: {
    method: "mercado_envios" | "pickup";
    street?: string;
    number?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN no configurado");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = (await req.json()) as BodyShape;

    // Validación mínima
    if (!body.items?.length) throw new Error("Carrito vacío");
    if (!body.buyer?.email || !body.buyer?.name || !body.buyer?.phone) {
      throw new Error("Faltan datos del comprador");
    }
    if (body.shipping.method === "mercado_envios") {
      if (!body.shipping.zip || !body.shipping.street || !body.shipping.city) {
        throw new Error("Faltan datos de envío");
      }
    }

    // Auth opcional - si está logueado guardamos user_id
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const subtotal = body.items.reduce(
      (s, i) => s + i.unit_price * i.quantity,
      0,
    );

    // 1. Crear orden en BD (estado pending)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        buyer_name: body.buyer.name,
        buyer_dni: body.buyer.dni,
        buyer_email: body.buyer.email,
        buyer_phone: body.buyer.phone,
        shipping_method: body.shipping.method,
        shipping_street: body.shipping.street,
        shipping_number: body.shipping.number,
        shipping_apartment: body.shipping.apartment,
        shipping_city: body.shipping.city,
        shipping_state: body.shipping.state,
        shipping_zip: body.shipping.zip,
        shipping_notes: body.shipping.notes,
        shipping_cost: 0, // Mercado Envíos lo calcula y lo agrega al total final
        subtotal,
        total: subtotal, // se actualiza con el shipping al confirmarse el pago
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (orderErr || !order) throw orderErr ?? new Error("No se pudo crear orden");

    // 2. Crear items
    const itemsRows = body.items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_title: i.title,
      product_image: i.image,
      variant: i.variant,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.unit_price * i.quantity,
    }));
    await supabase.from("order_items").insert(itemsRows);

    // 3. Construir preferencia MP
    const origin = req.headers.get("origin") || "https://rafaghellimotos.lovable.app";

    const preference: Record<string, unknown> = {
      items: body.items.map((i) => ({
        id: i.product_id,
        title: i.title.slice(0, 250),
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
        currency_id: "ARS",
        picture_url: i.image,
      })),
      payer: {
        name: body.buyer.name,
        email: body.buyer.email,
        phone: { number: body.buyer.phone },
        identification: body.buyer.dni
          ? { type: "DNI", number: body.buyer.dni }
          : undefined,
      },
      external_reference: order.id,
      back_urls: {
        success: `${origin}/checkout/success?order=${order.id}`,
        failure: `${origin}/checkout/failure?order=${order.id}`,
        pending: `${origin}/checkout/pending?order=${order.id}`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      statement_descriptor: "RAFAGHELLI MOTOS",
      metadata: { order_id: order.id },
    };

    // Envío: por ahora siempre "not_specified" (me2 requiere cuenta MP con Mercado Envíos habilitado).
    // Los datos de domicilio se guardan en la orden y el vendedor coordina el despacho manualmente.
    preference.shipments = { cost: 0, mode: "not_specified" };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error", mpData);
      throw new Error(`MP API: ${JSON.stringify(mpData)}`);
    }

    // 4. Guardar preference_id
    await supabase
      .from("orders")
      .update({ mp_preference_id: mpData.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        order_id: order.id,
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    console.error("create-mp-preference error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
