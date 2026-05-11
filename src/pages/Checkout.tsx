import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Store, Truck, ShieldCheck, Lock as LockIcon } from "lucide-react";

const PROVINCIAS = [
  "CABA", "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

const Checkout = () => {
  const { items, total } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'mercado_envios' | 'pickup'>('mercado_envios');
  const [form, setForm] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });

  React.useEffect(() => {
    if (user) setForm(f => ({ ...f, email: f.email || user.email || '' }));
  }, [user]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Cargando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <h1 className="text-2xl font-black italic mb-4">Tu carrito está vacío</h1>
        <Button onClick={() => navigate('/productos')}>Ver productos</Button>
      </div>
    );
  }

  const isFormValid =
    form.name && form.email && form.phone &&
    (shippingMethod === 'pickup' ||
      (form.street && form.number && form.city && form.state && form.zip && form.zip.length >= 4));

  const handlePay = async () => {
    if (!isFormValid) {
      toast.error("Completá todos los datos requeridos");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: {
          items: items.map(i => ({
            product_id: i.product.id,
            title: i.product.title,
            image: i.product.images?.[0],
            variant: i.variant,
            quantity: i.quantity,
            unit_price: Number(i.product.price),
          })),
          buyer: {
            name: form.name,
            dni: form.dni || undefined,
            email: form.email,
            phone: form.phone,
          },
          shipping: {
            method: shippingMethod,
            street: form.street || undefined,
            number: form.number || undefined,
            apartment: form.apartment || undefined,
            city: form.city || undefined,
            state: form.state || undefined,
            zip: form.zip || undefined,
            notes: form.notes || undefined,
          },
        },
      });
      if (error) throw error;
      if (!data?.init_point && !data?.sandbox_init_point) {
        throw new Error("No se recibió el link de pago de Mercado Pago");
      }
      // No limpiamos el carrito acá: solo se vacía cuando el pago se confirma (CheckoutSuccess).
      // Si el pago falla o se cancela, el cliente conserva sus productos para reintentar.
      // sandbox_init_point en modo TEST, init_point en producción
      window.location.href = data.sandbox_init_point || data.init_point;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al iniciar el pago");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10">
      <h1 className="text-3xl md:text-4xl font-black italic text-foreground mb-2">FINALIZAR COMPRA</h1>
      <p className="text-sm text-muted-foreground mb-8">Pagás online con Mercado Pago — tarjeta de crédito, débito o efectivo.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="md:col-span-2 space-y-6">
          {/* Datos personales */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">1. Tus datos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Nombre y apellido *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="DNI" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} />
              <Input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <Input type="tel" placeholder="Teléfono *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </section>

          {/* Método de entrega */}
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">2. ¿Cómo lo recibís?</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setShippingMethod('mercado_envios')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${shippingMethod === 'mercado_envios' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <Truck className="w-5 h-5 mb-2 text-primary" />
                <p className="font-bold text-sm">Mercado Envíos</p>
                <p className="text-xs text-muted-foreground">Costo se calcula en el pago según tu CP</p>
              </button>
              <button
                type="button"
                onClick={() => setShippingMethod('pickup')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${shippingMethod === 'pickup' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <Store className="w-5 h-5 mb-2 text-primary" />
                <p className="font-bold text-sm">Retiro en local</p>
                <p className="text-xs text-muted-foreground">Sin costo de envío</p>
              </button>
            </div>

            {shippingMethod === 'mercado_envios' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Código postal *" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
                <select className="w-full p-2 px-3 border border-border rounded-md bg-background text-foreground text-sm" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                  <option value="">Provincia *</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <Input placeholder="Calle *" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="md:col-span-2" />
                <Input placeholder="Número *" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
                <Input placeholder="Piso / Depto (opcional)" value={form.apartment} onChange={e => setForm({ ...form, apartment: e.target.value })} />
                <Input placeholder="Localidad *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="md:col-span-2" />
                <Input placeholder="Aclaraciones para el cadete (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
              </div>
            )}
            {shippingMethod === 'pickup' && (
              <div className="bg-muted/40 border border-border rounded-lg p-3 text-sm">
                <p className="font-semibold">🏪 Retirá tu pedido en el local sin costo</p>
                <p className="text-muted-foreground text-xs mt-1">Te avisamos por email cuando esté listo (1–2 días hábiles).</p>
              </div>
            )}
          </section>
        </div>

        {/* RESUMEN */}
        <div className="bg-card border border-border rounded-2xl p-6 h-fit md:sticky md:top-24">
          <h2 className="text-lg font-bold mb-4">Resumen</h2>
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {items.map(item => (
              <div key={item.product.id} className="flex justify-between gap-2 text-sm">
                <span className="text-foreground line-clamp-2">{item.product.title} <span className="text-muted-foreground">×{item.quantity}</span></span>
                <span className="font-semibold whitespace-nowrap">${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${total.toLocaleString('es-AR')}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Envío</span><span className="text-xs">{shippingMethod === 'pickup' ? 'GRATIS' : 'Calculado al pagar'}</span></div>
            <div className="flex justify-between font-black text-lg border-t border-border pt-2 text-foreground">
              <span>Total</span>
              <span>${total.toLocaleString('es-AR')}{shippingMethod === 'mercado_envios' && <span className="text-xs font-normal text-muted-foreground"> + envío</span>}</span>
            </div>
          </div>

          <Button
            onClick={handlePay}
            disabled={!isFormValid || submitting}
            className="w-full mt-6 bg-primary text-primary-foreground py-6 rounded-lg font-black uppercase tracking-tighter text-base hover:bg-primary/90 transition-all disabled:opacity-40"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <span className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pagar con Mercado Pago</span>
            )}
          </Button>

          {/* Trust badges */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-600/30 bg-emerald-600/5">
              <LockIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="leading-tight">
                <p className="text-xs font-bold text-foreground">Sitio Seguro · Encriptación SSL</p>
                <p className="text-[10px] text-muted-foreground">Tus datos viajan cifrados de extremo a extremo</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3 text-center">Pagás con</p>
              <div className="flex items-center justify-center mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#00B1EA] text-white">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l4.59-4.58L17 10.5l-6 6z"/></svg>
                  <span className="font-black text-sm tracking-tight">Mercado Pago</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="px-2 py-1 rounded bg-[#1A1F71] text-white text-[10px] font-black italic tracking-wider">VISA</span>
                <span className="px-2 py-1 rounded bg-white border border-border text-[10px] font-black tracking-tight" style={{ color: '#EB001B' }}>Master<span style={{ color: '#F79E1B' }}>card</span></span>
                <span className="px-2 py-1 rounded bg-[#006FCF] text-white text-[10px] font-black tracking-tight">AMEX</span>
                <span className="px-2 py-1 rounded bg-[#FF5F00] text-white text-[10px] font-black tracking-tight">Naranja</span>
                <span className="px-2 py-1 rounded bg-[#0033A0] text-white text-[10px] font-black tracking-tight">Cabal</span>
                <span className="px-2 py-1 rounded bg-zinc-800 text-white text-[10px] font-black tracking-tight">Débito</span>
                <span className="px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-black tracking-tight">Efectivo</span>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3">Hasta 12 cuotas · Pago Seguro</p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compra Protegida por Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
