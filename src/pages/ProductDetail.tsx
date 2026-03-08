import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Shield, ChevronRight, MessageCircle, Box, ArrowLeft, CheckCircle2, Instagram, Phone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (data) {
        setProduct(data);
        const { data: relData } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .not('id', 'eq', data.id)
          .limit(4);
        setRelated(relData || []);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-black uppercase tracking-tighter text-zinc-400">Sincronizando con Rafaghelli...</p>
      </div>
    </div>
  );

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-xl font-bold mb-4">Producto no encontrado</p>
        <Button asChild className="bg-orange-500 rounded-2xl"><Link to="/productos">Ir al catálogo</Link></Button>
      </div>
    );
  }

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`¡Hola Rafaghelli Motos! 👋 Me interesa este producto: ${product.title}. ¿Tienen stock disponible?`);
    // Número de VENTAS actualizado: 1157074145
    window.open(`https://wa.me/5491157074145?text=${message}`, '_blank');
  };

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-10 px-6 max-w-7xl mx-auto">
      {/* Navegación Superior */}
      <div className="flex justify-between items-center mb-8">
        <Link to="/productos" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 font-black uppercase text-[10px] tracking-widest transition-all">
          <ArrowLeft size={14} /> Volver
        </Link>
        <div className="flex gap-4">
          <a href="https://instagram.com/rafaghellimotos" target="_blank" className="text-zinc-300 hover:text-pink-500 transition-colors">
            <Instagram size={18} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Galería de Imágenes */}
        <div className="sticky top-24">
          <div className="aspect-square bg-zinc-50 rounded-[3rem] overflow-hidden border border-zinc-100 shadow-2xl relative">
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-6 left-6 bg-orange-500 text-white font-black px-4 py-2 rounded-2xl italic text-lg shadow-lg">
                {discountPercent}% OFF
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4 mt-6 overflow-x-auto pb-2 px-2">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-24 h-24 flex-shrink-0 rounded-[1.5rem] overflow-hidden border-4 transition-all ${i === activeImage ? "border-orange-500 scale-95 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info del Producto */}
        <div className="flex flex-col lg:pl-6">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-zinc-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest">{product.category}</span>
              <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest border border-orange-500/20 px-3 py-1.5 rounded-lg">{product.brand || 'Original'}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] italic text-zinc-900">
              {product.title}
            </h1>
          </div>

          <div className="mb-10 bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            {hasDiscount && (
              <p className="text-xl text-zinc-400 line-through font-bold mb-1">{formatPrice(product.original_price)}</p>
            )}
            <div className="text-6xl font-black text-zinc-900 tracking-tighter leading-none mb-4">
              {formatPrice(product.price)}
            </div>
            <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
              <Box size={18} className="text-orange-500" /> 
              Stock disponible: <span className="text-zinc-900">{product.stock} unidades</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {product.free_shipping && (
              <div className="flex items-center gap-4 p-5 bg-green-50 rounded-3xl border border-green-100">
                <Truck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-xs font-black uppercase text-green-700">Envío Gratis</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase">A todo el país</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 p-5 bg-orange-50 rounded-3xl border border-orange-100">
              <Shield className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-xs font-black uppercase text-orange-700">Garantía</p>
                <p className="text-[10px] text-orange-600 font-bold uppercase">Oficial Rafaghelli</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleWhatsAppClick}
              className="w-full bg-zinc-900 hover:bg-orange-500 text-white h-24 rounded-[2.5rem] text-2xl font-black uppercase tracking-tighter shadow-2xl transition-all active:scale-95 group"
            >
              <MessageCircle size={32} className="mr-4 group-hover:rotate-12 transition-transform" />
              Consultar Ventas
            </Button>
            
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-zinc-400" />
                <span className="text-[10px] font-black uppercase text-zinc-400">Ventas: 11 5707-4145</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-zinc-400" />
                <span className="text-[10px] font-black uppercase text-zinc-400">Taller: 11 7163-0707</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción Técnica */}
      <div className="mt-24">
        <div className="max-w-3xl">
          <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-8 flex items-center gap-4 text-zinc-900">
            Detalles <span className="text-orange-500">Técnicos</span>
          </h3>
          <div className="bg-white p-10 rounded-[3rem] border-2 border-zinc-100 shadow-sm">
            <p className="text-zinc-600 text-xl leading-relaxed font-medium whitespace-pre-line">
              {product.description || "Consultanos las especificaciones técnicas de este repuesto. Contamos con asesoramiento especializado en nuestro taller propio."}
            </p>
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-orange-500 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Sugerencias</p>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Productos Relacionados</h3>
            </div>
            <Link to="/productos" className="text-zinc-400 hover:text-zinc-900 text-xs font-black uppercase tracking-widest transition-colors">Ver catálogo completo ›</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default ProductDetail;

