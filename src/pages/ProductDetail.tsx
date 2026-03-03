import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Zap, Truck, Shield, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductBySlug, products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

const formatPrice = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const ProductDetail = () => {
  const { slug } = useParams();
  const product = getProductBySlug(slug || "");
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [activeImage, setActiveImage] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<{ q: string; a?: string }[]>([
    { q: "¿Hacen envíos al interior?", a: "¡Sí! Enviamos a todo el país por Correo Argentino o Andreani. Consulta costos de envío." },
    { q: "¿Tienen garantía?", a: "Todos nuestros productos cuentan con garantía oficial del fabricante." },
  ]);

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-xl text-muted-foreground mb-4">Producto no encontrado</p>
        <Button variant="cta" asChild><Link to="/productos">Ver productos</Link></Button>
      </div>
    );
  }

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleAddQuestion = () => {
    if (question.trim()) {
      setQuestions(prev => [...prev, { q: question.trim() }]);
      setQuestion("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-1 flex-wrap">
        <Link to="/" className="hover:text-primary">Inicio</Link><span>/</span>
        <Link to={`/productos?categoria=${product.category}`} className="hover:text-primary capitalize">{product.category}</Link><span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div
            className="aspect-square bg-muted rounded-xl overflow-hidden cursor-zoom-in relative"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-200"
              style={zoomed ? { transform: "scale(2)", transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? "border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nuevo | +{product.stock} vendidos</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{product.title}</h1>
          </div>

          <div>
            {product.originalPrice && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-sm font-semibold text-success">{discount}% OFF</span>
              </div>
            )}
            <p className="text-4xl font-bold">{formatPrice(product.price)}</p>
            <p className="text-sm text-muted-foreground mt-1">en 1 pago · o hasta <span className="font-semibold text-foreground">12 cuotas de {formatPrice(Math.round(product.price / 12))}</span></p>
          </div>

          {product.freeShipping && (
            <div className="flex items-center gap-2 text-success">
              <Truck className="h-5 w-5" />
              <span className="text-sm font-semibold">Envío gratis a todo el país</span>
            </div>
          )}

          {/* Variants */}
          {product.variants?.map(v => (
            <div key={v.label}>
              <p className="text-sm font-medium mb-2">{v.label}: <span className="text-muted-foreground">{selectedVariant || "Seleccionar"}</span></p>
              <div className="flex gap-2">
                {v.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedVariant(opt)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedVariant === opt ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-muted-foreground"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="cta" size="lg" onClick={() => addItem(product, selectedVariant)}>
              <Zap className="h-5 w-5 mr-1" /> Comprar ahora
            </Button>
            <Button variant="cta-outline" size="lg" onClick={() => addItem(product, selectedVariant)}>
              <ShoppingCart className="h-5 w-5 mr-1" /> Agregar al carrito
            </Button>
          </div>

          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> Garantía oficial</span>
            <span>Stock: {product.stock} unidades</span>
          </div>
        </div>
      </div>

      {/* Description + Specs + Q&A */}
      <div className="mt-12 space-y-10">
        {/* Description */}
        <section>
          <h2 className="text-xl font-display font-bold mb-4">Descripción</h2>
          <div className="bg-card rounded-xl border p-6">
            <p className="text-foreground leading-relaxed">{product.description}</p>
          </div>
        </section>

        {/* Specs */}
        <section>
          <h2 className="text-xl font-display font-bold mb-4">Ficha Técnica</h2>
          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(product.specs).map(([key, val], i) => (
                  <tr key={key} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-3 font-medium text-muted-foreground w-1/3">{key}</td>
                    <td className="px-4 py-3">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Q&A */}
        <section>
          <h2 className="text-xl font-display font-bold mb-4">Preguntas y respuestas</h2>
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Hacé una pregunta sobre este producto..."
                className="flex-1 px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => e.key === "Enter" && handleAddQuestion()}
              />
              <Button variant="cta" onClick={handleAddQuestion}><Send className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              {questions.map((item, i) => (
                <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                  <p className="text-sm font-medium">{item.q}</p>
                  {item.a ? (
                    <p className="text-sm text-muted-foreground mt-1 pl-4 border-l-2 border-primary">{item.a}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 italic">Esperando respuesta del vendedor...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold">Productos relacionados</h3>
            <Link to={`/productos?categoria=${product.category}`} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Ver más <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default ProductDetail;
