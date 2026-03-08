import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Workshop from "@/pages/Workshop";
import Admin from "@/pages/Admin";
import Motos from "@/pages/Motos";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";
import { MessageCircle } from "lucide-react"; // Importamos el icono

const queryClient = new QueryClient();

// COMPONENTE DEL BOTÓN FLOTANTE (Esquina Izquierda)
const WhatsAppFloating = () => (
  <a
    href="https://wa.me/5491157074145" // Tu número de ventas
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center group border-2 border-white"
  >
    <MessageCircle size={32} />
    <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 font-black uppercase text-[10px] whitespace-nowrap tracking-tighter">
      Consultar Ventas
    </span>
  </a>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
          <div className="flex flex-col min-h-screen relative">
            <Header />
            <CartDrawer />
            
            {/* BOTÓN FLOTANTE SIEMPRE VISIBLE */}
            <WhatsAppFloating />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/productos" element={<ProductList />} />
                <Route path="/producto/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/motos" element={<Motos />} />
                <Route path="/taller" element={<Workshop />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
