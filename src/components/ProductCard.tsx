import { Link } from "react-router-dom";
import { Truck, Tag } from "lucide-react";
import { motion } from "framer-motion";

// Definimos la interfaz para que coincida con lo que viene de Supabase
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
    maximumFractionDigits: 0 
  }).format(n);

const ProductCard = ({ product }: { product: Product }) => {
  // Lógica corregida para los campos de tu SQL:
  // product.price es lo que paga el cliente hoy.
  // product.original_price es el precio tachado (más alto).
  
  const hasDiscount = product.is_on_sale && product.original_price && product.original_price > product.price;

  // Cálculo del porcentaje de ahorro
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  return (
    <Link to={`/producto/${product.slug}`} className="group block">
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative"
      >
        {/* BADGE DE OFERTA FLOTANTE */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full font-black text-[10px] uppercase italic shadow-lg flex items-center gap-1 -rotate-2">
              <Tag size={10} fill="currentColor" />
              {discountPercentage}% OFF
            </div>
          </div>
        )}

        {/* IMAGEN PRINCIPAL */}
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* INFO */}
        <div className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic">
              {product.brand || "Original"}
            </p>
          </div>
          
          <p className="text-sm text-gray-900 font-black uppercase italic leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </p>

          <div className="space-y-0.5">
            {hasDiscount && (
              <p className="text-[11px] text-gray-400 line-through font-bold">
                {formatPrice(product.original_price!)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xl font-black text-gray-900 italic tracking-tighter">
                {formatPrice(product.price)}
              </p>
              
              {product.free_shipping && (
                <div className="bg-green-100 p-1.5 rounded-full text-green-600 shadow-sm shadow-green-200">
                  <Truck className="h-4 w-4" strokeWidth={3} />
                </div>
              )}
            </div>
          </div>

          {/* ETIQUETA ENVIO TEXTO */}
          {product.free_shipping && (
            <p className="text-[9px] font-black text-green-600 uppercase tracking-tighter">
              Envío Gratis
            </p>
          )}
        </div>

        {/* Línea decorativa inferior que aparece al hover */}
        <div className="h-1.5 w-full bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
      </motion.div>
    </Link>
  );
};

export default ProductCard;
