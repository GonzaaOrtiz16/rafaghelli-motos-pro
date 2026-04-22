export const NOTIFY_EMAIL = "gonzaaortiz16@gmail.com";

export const mapMpPaymentStatus = (status?: string | null) => {
  const statusMap: Record<string, string> = {
    approved: "approved",
    pending: "pending",
    in_process: "in_process",
    rejected: "rejected",
    cancelled: "cancelled",
    refunded: "refunded",
    charged_back: "refunded",
  };

  return statusMap[status ?? ""] || "pending";
};

export async function sendOwnerEmail(order: any, resendKey?: string | null) {
  if (!order || !resendKey) return;

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
  } catch (error) {
    console.error("sendOwnerEmail error", error);
  }
}