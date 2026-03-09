import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user, loading } = useAuth();
  const [shippingCost, setShippingCost] = useState(0);
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
    if (prov === "CABA" || prov === "Buenos Aires") {
      setShippingCost(4500);
    } else if (prov === "") {
      setShippingCost(0);
    } else {
      setShippingCost(6800);
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
      `*Envío (Correo Argentino):* $${shippingCost}%0A` +
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
            <option value="CABA">CABA</option>
            <option value="Buenos Aires">Buenos Aires</option>
            <option value="Catamarca">Catamarca</option>
            <option value="Chaco">Chaco</option>
            <option value="Chubut">Chubut</option>
            <option value="Córdoba">Córdoba</option>
            <option value="Corrientes">Corrientes</option>
            <option value="Entre Ríos">Entre Ríos</option>
            <option value="Formosa">Formosa</option>
            <option value="Jujuy">Jujuy</option>
            <option value="La Pampa">La Pampa</option>
            <option value="La Rioja">La Rioja</option>
            <option value="Mendoza">Mendoza</option>
            <option value="Misiones">Misiones</option>
            <option value="Neuquén">Neuquén</option>
            <option value="Río Negro">Río Negro</option>
            <option value="Salta">Salta</option>
            <option value="San Juan">San Juan</option>
            <option value="San Luis">San Luis</option>
            <option value="Santa Cruz">Santa Cruz</option>
            <option value="Santa Fe">Santa Fe</option>
            <option value="Santiago del Estero">Santiago del Estero</option>
            <option value="Tierra del Fuego">Tierra del Fuego</option>
            <option value="Tucumán">Tucumán</option>
          </select>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Resumen</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm text-foreground">
                <span>{item.product.title} (x{item.quantity})</span>
                <span>${item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Envío Correo Argentino</span>
              <span>{shippingCost > 0 ? `$${shippingCost}` : 'A calcular'}</span>
            </div>
            <div className="flex justify-between font-black text-lg border-t border-border pt-2 text-foreground">
              <span>Total Final</span>
              <span>${total + shippingCost}</span>
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

// Need Button import
import { Button } from "@/components/ui/button";

export default Checkout;
