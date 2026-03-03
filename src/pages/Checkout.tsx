import React, { useState } from 'react';
import { useCart } from '../context/CartContext'; // Ajustá la ruta según tu carpeta

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const [shippingCost, setShippingCost] = useState(0);
  const [userData, setUserData] = useState({
    nombre: '',
    direccion: '',
    localidad: '',
    provincia: ''
  });

  const handleProvinciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    setUserData({ ...userData, provincia: prov });
    
    // Lógica de costos de Correo Argentino para Rafaghelli Motos
    if (prov === "CABA" || prov === "Buenos Aires") {
      setShippingCost(4500);
    } else if (prov === "") {
      setShippingCost(0);
    } else {
      setShippingCost(6800);
    }
  };

  const enviarWhatsApp = () => {
    const nro = "5491165483728"; // Tu número de @gos_motos
    const totalFinal = total + shippingCost;
    
    // Tu contexto usa 'items' que tiene { product, quantity }
    const productosTxt = items.map(item => 
      `- ${item.product.title} x${item.quantity} ($${item.product.price * item.quantity})`
    ).join('%0A');
    
    const mensaje = `*NUEVO PEDIDO - RAFAGHELLI MOTOS*%0A%0A` +
      `*Cliente:* ${userData.nombre}%0A` +
      `*Entrega:* ${userData.direccion}, ${userData.localidad} (${userData.provincia})%0A%0A` +
      `*Productos:*%0A${productosTxt}%0A%0A` +
      `*Subtotal:* $${total}%0A` +
      `*Envío (Correo Argentino):* $${shippingCost}%0A` +
      `*TOTAL A PAGAR:* $${totalFinal}%0A%0A` +
      `Hola! Vengo de la web, ¿me confirman stock para transferir?`;

    window.open(`https://wa.me/${nro}?text=${mensaje}`, '_blank');
    // Opcional: clearCart(); // Descomenta si quieres vaciar el carro al enviar
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Formulario de Datos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Datos de Envío</h2>
          <input 
            type="text" placeholder="Nombre y Apellido" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setUserData({...userData, nombre: e.target.value})}
          />
          <input 
            type="text" placeholder="Calle y número" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setUserData({...userData, direccion: e.target.value})}
          />
          <input 
            type="text" placeholder="Localidad" 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={(e) => setUserData({...userData, localidad: e.target.value})}
          />
          <select 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            onChange={handleProvinciaChange}
          >
            <option value="">Seleccionar Provincia</option>
            <option value="CABA">CABA</option>
            <option value="Buenos Aires">Buenos Aires</option>
            <option value="Santa Fe">Santa Fe</option>
            <option value="Cordoba">Córdoba</option>
            <option value="Mendoza">Mendoza</option>
            <option value="Otra">Resto del país</option>
          </select>
        </div>

        {/* Resumen de la Orden */}
        <div className="bg-gray-50 p-6 rounded-xl border">
          <h2 className="text-xl font-semibold mb-4">Resumen</h2>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.product.title} (x{item.quantity})</span>
                <span>${item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Envío Correo Argentino</span>
              <span>${shippingCost > 0 ? `$${shippingCost}` : 'A calcular'}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Final</span>
              <span>${total + shippingCost}</span>
            </div>
          </div>

          <button 
            onClick={enviarWhatsApp}
            disabled={items.length === 0 || !userData.nombre || !userData.provincia}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            COMPRAR POR WHATSAPP
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Al hacer clic, se abrirá un chat de WhatsApp con tu pedido listo para ser procesado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
