import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

// Tarifas Correo Argentino por zona (paquete hasta 5kg, envío a domicilio)
// Actualizado manualmente - revisar periódicamente
const SHIPPING_ZONES: Record<string, { zone: string; price: number }> = {
  "CABA":                { zone: "AMBA",      price: 5500 },
  "Buenos Aires":        { zone: "AMBA",      price: 5500 },
  "Santa Fe":            { zone: "Centro",    price: 7200 },
  "Córdoba":             { zone: "Centro",    price: 7200 },
  "Entre Ríos":          { zone: "Centro",    price: 7200 },
  "La Pampa":            { zone: "Centro",    price: 7200 },
  "Mendoza":             { zone: "Cuyo",      price: 8500 },
  "San Juan":            { zone: "Cuyo",      price: 8500 },
  "San Luis":            { zone: "Cuyo",      price: 8500 },
  "Tucumán":             { zone: "NOA",       price: 9200 },
  "Salta":               { zone: "NOA",       price: 9200 },
  "Jujuy":               { zone: "NOA",       price: 9200 },
  "Catamarca":           { zone: "NOA",       price: 9200 },
  "Santiago del Estero": { zone: "NOA",       price: 9200 },
  "La Rioja":            { zone: "NOA",       price: 9200 },
  "Corrientes":          { zone: "NEA",       price: 9200 },
  "Misiones":            { zone: "NEA",       price: 9200 },
  "Chaco":               { zone: "NEA",       price: 9200 },
  "Formosa":             { zone: "NEA",       price: 9200 },
  "Neuquén":             { zone: "Patagonia", price: 10800 },
  "Río Negro":           { zone: "Patagonia", price: 10800 },
  "Chubut":              { zone: "Patagonia", price: 10800 },
  "Santa Cruz":          { zone: "Patagonia", price: 10800 },
  "Tierra del Fuego":    { zone: "Patagonia", price: 10800 },
};

const PROVINCIAS = Object.keys(SHIPPING_ZONES).sort((a, b) => {
  if (a === "CABA") return -1;
  if (b === "CABA") return 1;
  if (a === "Buenos Aires") return -1;
  if (b === "Buenos Aires") return 1;
  return a.localeCompare(b);
});

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, loading } = useAuth();
  const [shippingCost, setShippingCost] = useState(0);
  const [selectedZone, setSelectedZone] = useState('');
  const [userData, setUserData] = useState({
    nombre: '',
    direccion: '',
    localidad: '',
    provincia: ''
  });

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    setUserData({ ...userData, provincia: prov });
    if (prov && SHIPPING_ZONES[prov]) {
      setShippingCost(SHIPPING_ZONES[prov].price);
      setSelectedZone(SHIPPING_ZONES[prov].zone);
    } else {
      setShippingCost(0);
      setSelectedZone('');
    }
  };

  const enviarWhatsApp = () => {
    const nro = "5491165483728";
    const totalFinal = total + shippingCost;
    const productosTxt = items.map(item =>
      `- ${item.product.title} x${item.quantity} ($${item.product.price * item.quantity})`
    ).join('%0A');
    const mensaje = `*NUEVO PEDIDO - RAFAGHELLI MOTOS*%0A%0A` +
      `*Cliente:* ${userData.nombre}%0A` +
      `*Email:* ${user.email}%0A` +
      `*Entrega:* ${userData.direccion}, ${userData.localidad} (${userData.provincia})%0A%0A` +
      `*Productos:*%0A${productosTxt}%0A%0A` +
      `*Subtotal:* $${total}%0A` +
      `*Envío (Correo Argentino - Zona ${selectedZone}):* $${shippingCost}%0A` +
      `*TOTAL A PAGAR:* $${totalFinal}%0A%0A` +
      `Hola! Vengo de la web, ¿me confirman stock para transferir?`;
    window.open(`https://wa.me/${nro}?text=${mensaje}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <h1 className="text-3xl font-black italic text-foreground mb-8">FINALIZAR COMPRA</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Datos de Envío</h2>
          <input
            type="text" placeholder="Nombre y Apellido"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            onChange={(e) => setUserData({ ...userData, nombre: e.target.value })}
          />
          <input
            type="text" placeholder="Calle y número"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            onChange={(e) => setUserData({ ...userData, direccion: e.target.value })}
          />
          <input
            type="text" placeholder="Localidad"
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            onChange={(e) => setUserData({ ...userData, localidad: e.target.value })}
          />
          <select
            className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            onChange={handleProvinciaChange}
            value={userData.provincia}
          >
            <option value="">Seleccionar Provincia</option>
            {PROVINCIAS.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          {selectedZone && (
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">📦 Correo Argentino - Zona {selectedZone}</p>
              <p>Envío a domicilio (hasta 5kg): <span className="font-bold text-primary">${shippingCost.toLocaleString('es-AR')}</span></p>
              <p className="text-xs mt-1">Tarifas referenciales. Pueden variar según peso y dimensiones.</p>
            </div>
          )}
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Resumen</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm text-foreground">
                <span>{item.product.title} (x{item.quantity})</span>
                <span>${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>${total.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Envío Correo Argentino {selectedZone && `(${selectedZone})`}</span>
              <span>{shippingCost > 0 ? `$${shippingCost.toLocaleString('es-AR')}` : 'Seleccioná provincia'}</span>
            </div>
            <div className="flex justify-between font-black text-lg border-t border-border pt-2 text-foreground">
              <span>Total Final</span>
              <span>${(total + shippingCost).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <Button
            onClick={enviarWhatsApp}
            disabled={items.length === 0 || !userData.nombre || !userData.provincia}
            className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-lg font-black uppercase tracking-tighter text-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            COMPRAR POR WHATSAPP
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Al hacer clic, se abrirá un chat de WhatsApp con tu pedido listo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
