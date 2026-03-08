import { Link } from "react-router-dom";
import { Truck, Tag, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  title: string;
  price: number;
  original_price?: number | null;
  images: string[];
  category: string;
  brand: string;
  free_shipping: boolean;
  is_on_sale: boolean;
  slug: string;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const ProductCard = ({ product }: { product: Product }) => {
  const hasDiscount = product.is_on_sale && product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <Link to={`/producto/${product.slug}`} className="group block">
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-card rounded-[2rem] overflow-hidden border border-border shadow-sm hover:shadow-xl transition-shadow duration-300 relative"
      >
        {/* BADGE DE OFERTA FLOTANTE */}
        {hasDiscount && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -2 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute top-3 left-3 z-10"
          >
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-black text-[10px] uppercase italic shadow-lg flex items-center gap-1">
              <Tag size={10} fill="currentColor" />
              {discountPercentage}% OFF
            </div>
          </motion.div>
        )}

        {/* IMAGEN PRINCIPAL */}
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={product.images?.[0] || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Overlay sutil al hover */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
        </div>

        {/* INFO */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">
              {product.brand || "Original"}
            </p>
          </div>

          <p className="text-sm text-foreground font-black uppercase italic leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </p>

          <div className="space-y-0.5">
            {hasDiscount && (
              <p className="text-[11px] text-muted-foreground line-through font-bold">
                {formatPrice(product.original_price!)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xl font-black text-foreground italic tracking-tighter">
                {formatPrice(product.price)}
              </p>

              {product.free_shipping && (
                <div className="bg-success/10 p-1.5 rounded-full text-success shadow-sm">
                  <Truck className="h-4 w-4" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          {product.free_shipping && (
            <p className="text-[9px] font-black text-success uppercase tracking-tighter">
              Envío Gratis
            </p>
          )}
        </div>

        {/* Línea decorativa inferior que aparece al hover */}
        <div className="h-1.5 w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
      </motion.div>
    </Link>
  );
};

export default ProductCard;
