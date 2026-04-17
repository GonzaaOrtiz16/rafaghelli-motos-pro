import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useState, useEffect } from 'react'; // Importamos useEffect
import ScrollToTop from "@/components/ScrollToTop";
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
import ResetPassword from "@/pages/ResetPassword";
import POS from "@/pages/POS";
import NotFound from "./pages/NotFound";
import { MessageCircle, X, Instagram } from "lucide-react";

const queryClient = new QueryClient();

// ===================== SELLO PERSONAL (ESTILO VENPLAST) =====================
const Watermark = () => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex items-center gap-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/40 pl-2 pr-1 py-1 rounded-full shadow-sm">
      <div className="flex items-center gap-1.5 px-1">
        <div className="text-[#E1306C]">
          <Instagram size={13} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-[10px] font-medium text-zinc-400 font-sans">Edit by</span>
          <a 
            href="https://instagram.com/gonzaaortiz16" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#00BAE2] font-sans"
          >
            @gonzaaortiz16
          </a>
        </div>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="ml-1 p-0.5 hover:bg-zinc-200/50 rounded-full text-zinc-300 transition-colors"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// COMPONENTE DEL BOTÓN FLOTANTE (A la Derecha)
const WhatsAppFloating = () => (
  <a
    href="https://wa.me/5491157074145"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center group border-2 border-white"
  >
    <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:mr-2 transition-all duration-500 font-black uppercase text-[10px] whitespace-nowrap tracking-tighter order-first font-sans">
      Consultar Ventas
    </span>
    <MessageCircle size={32} />
  </a>
);

const AppLayout = () => {
  const location = useLocation();
  const isBackoffice = location.pathname.startsWith('/admin') || location.pathname.startsWith('/ventas');

  return (
    <div className="flex flex-col min-h-screen relative">
      {!isBackoffice && <Header />}
      <CartDrawer />

      {!isBackoffice && (
        <>
          <WhatsAppFloating />
          <Watermark />
        </>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<ProductList />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/motos" element={<Motos />} />
          <Route path="/taller" element={<Workshop />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ventas" element={<POS />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isBackoffice && <Footer />}
    </div>
  );
};

const App = () => {
  // --- LÓGICA PARA BORRAR EL SELLO DE LOVABLE POR CÓDIGO ---
  useEffect(() => {
    const removeBadge = () => {
      // Buscamos el elemento de Lovable por ID o Clase
      const badge = document.querySelector('#lovable-badge') || 
                    document.querySelector('.lovable-badge') ||
                    document.querySelector('iframe[title*="Lovable"]');
      if (badge) {
        badge.remove();
      }
    };

    // Intentamos borrarlo al cargar
    removeBadge();
    
    // Lo seguimos intentando cada 1 segundo por si vuelve a aparecer
    const interval = setInterval(removeBadge, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartProvider>
            <ScrollToTop />
            <AppLayout />
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
