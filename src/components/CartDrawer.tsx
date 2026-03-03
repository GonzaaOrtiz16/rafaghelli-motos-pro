import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Carrito ({itemCount})
              </h2>
              <button onClick={closeCart} className="p-1 hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <ShoppingBag className="h-16 w-16 opacity-30" />
                <p className="text-sm">Tu carrito está vacío</p>
                <Button variant="cta" size="sm" onClick={closeCart}>Seguir comprando</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {items.map(item => (
                    <div key={item.product.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                      <img src={item.product.images[0]} alt={item.product.title} className="w-20 h-20 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.title}</p>
                        {item.variant && <p className="text-xs text-muted-foreground">Talle: {item.variant}</p>}
                        <p className="text-sm font-bold mt-1">{formatPrice(item.product.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-muted transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                          <button onClick={() => removeItem(item.product.id)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold">{formatPrice(total)}</span>
                  </div>
                  <Button
                    variant="cta"
                    className="w-full"
                    size="lg"
                    onClick={() => { closeCart(); navigate("/checkout"); }}
                  >
                    Ir al Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={closeCart}>
                    Seguir comprando
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
