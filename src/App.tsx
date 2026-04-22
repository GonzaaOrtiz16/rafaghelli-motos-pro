import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { lazy, Suspense, useEffect, useState } from "react";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import Home from "@/pages/Home";
import { MessageCircle, X, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Code-splitting: cargar páginas pesadas bajo demanda
const ProductList = lazy(() => import("@/pages/ProductList"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutFailure = lazy(() => import("@/pages/CheckoutFailure"));
const CheckoutPending = lazy(() => import("@/pages/CheckoutPending"));
const MyOrders = lazy(() => import("@/pages/MyOrders"));
const Workshop = lazy(() => import("@/pages/Workshop"));
const Admin = lazy(() => import("@/pages/Admin"));
const Motos = lazy(() => import("@/pages/Motos"));
const Auth = lazy(() => import("@/pages/Auth"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const POS = lazy(() => import("@/pages/POS"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Footer = lazy(() => import("@/components/Footer"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("JWT expired") || message.includes("invalid JWT")) return false;
        return failureCount < 1;
      },
    },
  },
});

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

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
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
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/productos" element={<ProductList />} />
            <Route path="/producto/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/failure" element={<CheckoutFailure />} />
            <Route path="/checkout/pending" element={<CheckoutPending />} />
            <Route path="/mis-compras" element={<MyOrders />} />
            <Route path="/motos" element={<Motos />} />
            <Route path="/taller" element={<Workshop />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/ventas" element={<POS />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isBackoffice && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </div>
  );
};

const AuthSessionGuard = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const onUnauthorized = async (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const message = detail?.message || "";
      if (!message.includes("JWT expired") && !message.includes("invalid JWT")) return;
      await supabase.auth.signOut({ scope: "local" });
      queryClient.clear();
    };

    window.addEventListener("app:auth-error", onUnauthorized);
    return () => window.removeEventListener("app:auth-error", onUnauthorized);
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider>
          <AuthSessionGuard>
            <ScrollToTop />
            <AppLayout />
          </AuthSessionGuard>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
