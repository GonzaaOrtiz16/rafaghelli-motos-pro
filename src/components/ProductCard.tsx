import { Link } from "react-router-dom";
import { Truck } from "lucide-react";
import type { Product } from "@/data/products";

const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const ProductCard = ({ product }: { product: Product }) => {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/producto/${product.slug}`} className="product-card group block">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-sm text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">{product.title}</p>
        <div className="flex items-baseline gap-2">
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-success">{discount}% OFF</span>
          )}
        </div>
        <p className="price-tag text-lg">{formatPrice(product.price)}</p>
        {product.freeShipping && (
          <span className="free-shipping-badge">
            <Truck className="h-3 w-3" /> Envío gratis
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
