import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, MapPin, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";

const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const steps = [
  { id: 1, label: "Datos de contacto", icon: User },
  { id: 2, label: "Envío", icon: MapPin },
  { id: 3, label: "Pago", icon: CreditCard },
];

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);

  if (items.length === 0 && !completed) {
    return (
      <div className="container py-20 text-center">
        <p className="text-xl text-muted-foreground mb-4">Tu carrito está vacío</p>
        <Button variant="cta" asChild><Link to="/productos">Ver productos</Link></Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="container py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-success-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">¡Compra confirmada!</h2>
          <p className="text-muted-foreground mb-6">Recibirás un email con los detalles de tu pedido.</p>
          <Button variant="cta" asChild><Link to="/">Volver al inicio</Link></Button>
        </motion.div>
      </div>
    );
  }

  const handleComplete = () => { clearCart(); setCompleted(true); };

  return (
    <div className="container py-8 max-w-4xl">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${step >= s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-xl font-display font-bold">Datos de contacto</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium block mb-1">Nombre</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Juan" /></div>
                  <div><label className="text-sm font-medium block mb-1">Apellido</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Pérez" /></div>
                </div>
                <div><label className="text-sm font-medium block mb-1">Email</label><input type="email" className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="juan@email.com" /></div>
                <div><label className="text-sm font-medium block mb-1">Teléfono</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="11 1234-5678" /></div>
                <Button variant="cta" className="w-full" onClick={() => setStep(2)}>Continuar</Button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-xl font-display font-bold">Dirección de envío</h2>
                <div><label className="text-sm font-medium block mb-1">Dirección</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Av. San Martín 1234" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium block mb-1">Ciudad</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="CABA" /></div>
                  <div><label className="text-sm font-medium block mb-1">Código Postal</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="1414" /></div>
                </div>
                <div><label className="text-sm font-medium block mb-1">Provincia</label><input className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Buenos Aires" /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Volver</Button>
                  <Button variant="cta" className="flex-1" onClick={() => setStep(3)}>Continuar</Button>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card rounded-xl border p-6 space-y-4">
                <h2 className="text-xl font-display font-bold">Medio de pago</h2>
                <div className="space-y-3">
                  {["Tarjeta de crédito", "Tarjeta de débito", "Transferencia bancaria", "Mercado Pago"].map(m => (
                    <label key={m} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input type="radio" name="payment" className="accent-primary" defaultChecked={m === "Tarjeta de crédito"} />
                      <span className="text-sm font-medium">{m}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Volver</Button>
                  <Button variant="cta" className="flex-1" onClick={handleComplete}>Confirmar compra</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="bg-card rounded-xl border p-4 h-fit sticky top-32">
          <h3 className="font-semibold mb-4">Resumen de compra</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.product.id} className="flex gap-2 text-sm">
                <img src={item.product.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.product.title}</p>
                  <p className="text-muted-foreground">x{item.quantity}</p>
                </div>
                <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
