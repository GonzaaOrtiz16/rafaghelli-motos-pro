import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
// Importamos la interfaz Product para que no haya errores de tipo
import type { Product } from "@/data/products";

const formatPrice = (n: number) => 
  new Intl.NumberFormat("es-AR", { 
    style: "currency", 
    currency: "ARS", 
    maximumFractionDigits: 0 
  }).format(n);

const ProductCard = ({ product }: { product: Product }) => {
  // Lógica de Precios para Supabase:
  // product.price es el precio base.
  // product.discount_price es el precio rebajado (si existe).
  
  const hasDiscount = !!product.discount_price && product.is_on_sale;
  const finalPrice = hasDiscount ? product.discount_price : product.price;
  const originalPrice = hasDiscount ? product.price : null;

  // Cálculo del porcentaje de descuento
  const discountPercentage = originalPrice 
    ? Math.round((1 - (product.discount_price! / originalPrice)) * 100)
    : 0;

  return (
    <Link to={`/producto/${product.slug}`} className="product-card group block">
      <div className="aspect-square overflow-hidden bg-muted rounded-t-lg">
        <img
          src={product.images?.[0] || "/placeholder.svg"}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3 space-y-1.5">
        {/* Marca en chiquito para darle estilo de repuestos */}
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{product.brand}</p>
        
        <p className="text-sm text-foreground line-clamp-2 leading-tight min-h-[2.5rem] font-medium">
          {product.title}
        </p>

        <div className="flex items-baseline gap-2">
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="text-xs font-semibold text-green-600">
              {discountPercentage}% OFF
            </span>
          )}
        </div>

        <p className="price-tag text-lg font-bold">
          {formatPrice(finalPrice || 0)}
        </p>

        {product.has_free_shipping && (
          <span className="free-shipping-badge inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
            <Truck className="h-3 w-3" /> Envío gratis
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
