import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, X, Plus, Minus, Search, ShoppingCart, Trash2, CheckCircle, RotateCcw, Lock, ScanLine, LogOut, Shield, QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProductQRModal from "@/components/ProductQRModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const SUPERVISOR_PIN = '1234';

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
  barcode: string | null;
}

const POS = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isEncargado, isVendedor, isStaff, displayName, loading: roleLoading } = useUserRole();
  const [scanning, setScanning] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [voiding, setVoiding] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Redirect if not staff
  useEffect(() => {
    if (!roleLoading && user && !isStaff) {
      toast.error("No tenés permisos para acceder a Ventas");
      navigate('/');
    }
  }, [roleLoading, user, isStaff, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!roleLoading && !user) {
      navigate('/auth');
    }
  }, [roleLoading, user, navigate]);

  const { data: products = [] } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('title');
      if (error) throw error;
      return data;
    }
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayMovements = [], refetch: refetchMovements } = useQuery({
    queryKey: ['pos-movements', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const salesGrouped = React.useMemo(() => {
    const ventas = todayMovements.filter(m => m.movement_type === 'venta');
    const groups: Record<string, typeof ventas> = {};
    ventas.forEach(v => {
      const key = v.created_at.slice(0, 19);
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [todayMovements]);

  const isVoided = useCallback((saleKey: string) => {
    return todayMovements.some(m => m.movement_type === 'anulacion' && m.reason?.includes(saleKey));
  }, [todayMovements]);

  // Scanner
  const startScanner = useCallback(() => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("pos-scanner-container");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            addProductByCode(decodedText);
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.error("Error cámara:", err);
        toast.error("No se pudo acceder a la cámara");
        setScanning(false);
      }
    }, 150);
  }, [products]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const addProductByCode = (code: string) => {
    const found = products.find(p => p.barcode === code || p.id === code);
    if (!found) {
      toast.error(`Producto no encontrado: ${code}`);
      return;
    }
    addToCart(found);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) {
        return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        stock: product.stock ?? 0,
        image: product.images?.[0] || '/placeholder.svg',
        barcode: product.barcode,
      }];
    });
    toast.success(`${product.title} agregado`);
    setManualSearch('');
    setSearchResults([]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newQty = Math.max(1, c.quantity + delta);
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleSearch = (query: string) => {
    setManualSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const q = query.toLowerCase();
    setSearchResults(products.filter(p =>
      p.title.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)
    ).slice(0, 6));
  };

  // Confirm sale - saves seller_name
  const confirmSale = async () => {
    if (cart.length === 0) return;
    setConfirming(true);
    try {
      const now = new Date().toISOString();
      const sellerName = user?.email || 'desconocido';
      for (const item of cart) {
        const newStock = Math.max(0, item.stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        await supabase.from('stock_movements').insert({
          product_id: item.id,
          movement_type: 'venta',
          quantity: -item.quantity,
          reason: `Venta POS - ${item.title} x${item.quantity}`,
          created_at: now,
          seller_name: sellerName,
        } as any);
      }
      toast.success(`Venta confirmada: ${formatPrice(total)}`);
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      refetchMovements();
    } catch (err) {
      toast.error("Error al confirmar la venta");
    }
    setConfirming(false);
  };

  // Void sale - encargado skips PIN
  const initiateVoid = (saleKey: string, items: any[]) => {
    if (isEncargado) {
      // Direct void without PIN
      setVoidTarget([saleKey, items]);
      performVoid(saleKey, items);
    } else {
      // Vendedor needs PIN
      setVoidTarget([saleKey, items]);
      setVoidModalOpen(true);
      setPin('');
    }
  };

  const handleVoidWithPin = async () => {
    if (pin !== SUPERVISOR_PIN) {
      toast.error("PIN incorrecto");
      return;
    }
    if (!voidTarget) return;
    const [saleKey, items] = voidTarget;
    await performVoid(saleKey, items);
    setVoidModalOpen(false);
    setPin('');
  };

  const performVoid = async (saleKey: string, items: any[]) => {
    setVoiding(true);
    try {
      const sellerName = user?.email || 'desconocido';
      for (const mov of items) {
        const absQty = Math.abs(mov.quantity);
        const { data: prod } = await supabase.from('products').select('stock').eq('id', mov.product_id).single();
        if (prod) {
          await supabase.from('products').update({ stock: (prod.stock ?? 0) + absQty }).eq('id', mov.product_id);
        }
        await supabase.from('stock_movements').insert({
          product_id: mov.product_id,
          movement_type: 'anulacion',
          quantity: absQty,
          reason: `Anulación de venta ${saleKey}`,
          seller_name: sellerName,
        } as any);
      }
      toast.success("Venta anulada correctamente");
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      refetchMovements();
    } catch {
      toast.error("Error al anular la venta");
    }
    setVoiding(false);
    setVoidTarget(null);
  };

  const getProductTitle = (productId: string | null) => {
    if (!productId) return 'Desconocido';
    const p = products.find(pr => pr.id === productId);
    return p?.title || productId.slice(0, 8);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-32">
      {/* Header */}
      <header className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <ScanLine size={20} className="text-orange-500" />
          <div>
            <span className="font-black uppercase text-sm italic tracking-tight">Rafaghelli Motos</span>
            <span className="text-[9px] text-zinc-400 font-bold ml-2 uppercase">POS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-400 font-bold">{displayName}</p>
            <p className="text-[9px] text-orange-400 font-black uppercase">{isEncargado ? 'Encargado' : 'Vendedor'}</p>
          </div>
          {isEncargado && (
            <button onClick={() => navigate('/admin')} className="text-zinc-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-1 transition-colors">
              <Shield size={14} /> Admin
            </button>
          )}
          <button onClick={handleLogout} className="text-zinc-400 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile user badge */}
      <div className="sm:hidden bg-zinc-800 px-4 py-2 flex items-center justify-between">
        <p className="text-[10px] text-zinc-300 font-bold truncate">{displayName}</p>
        <span className="text-[9px] text-orange-400 font-black uppercase bg-orange-500/10 px-2 py-0.5 rounded-full">
          {isEncargado ? 'Encargado' : 'Vendedor'}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Scanner */}
        <div className="space-y-3">
          {!scanning ? (
            <button onClick={startScanner} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-orange-500/20">
              <Camera size={20} /> Escanear Producto
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-2xl overflow-hidden border-2 border-orange-500 bg-black aspect-video">
                <div id="pos-scanner-container" className="w-full h-full" />
              </div>
              <button onClick={stopScanner} className="w-full bg-red-500 text-white py-3 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                <X size={16} /> Cerrar Cámara
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar producto..."
            className="w-full bg-white border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
            value={manualSearch}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border rounded-2xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b last:border-b-0">
                  <img src={p.images?.[0] || '/placeholder.svg'} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{p.title}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">Stock: {p.stock ?? 0}</p>
                  </div>
                  <p className="text-sm font-black text-orange-500">{formatPrice(p.price)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-zinc-50 flex items-center gap-2">
              <ShoppingCart size={16} className="text-orange-500" />
              <span className="font-black uppercase text-xs tracking-wider">Venta Actual ({cart.length})</span>
            </div>
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <img src={item.image} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase truncate">{item.title}</p>
                    <p className="text-xs text-zinc-500 font-bold">{formatPrice(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center active:bg-zinc-200">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center active:bg-zinc-200">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-black text-sm w-20 text-right">{formatPrice(item.price * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t bg-zinc-50">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black uppercase text-xs text-zinc-500">Total</span>
                <span className="text-2xl font-black text-zinc-900 italic">{formatPrice(total)}</span>
              </div>
              <button
                onClick={confirmSale}
                disabled={confirming}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] disabled:bg-zinc-300 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                {confirming ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        )}

        {/* Shift History */}
        <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-zinc-50">
            <span className="font-black uppercase text-xs tracking-wider">Historial del Turno</span>
          </div>
          {salesGrouped.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-400 text-xs font-bold">No hay ventas hoy</div>
          ) : (
            <div className="divide-y">
              {salesGrouped.map(([key, items]) => {
                const voided = isVoided(key);
                const saleTotal = items.reduce((s, i) => s + Math.abs(i.quantity) * (products.find(p => p.id === i.product_id)?.price ?? 0), 0);
                const time = new Date(key).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                const seller = (items[0] as any)?.seller_name || '';
                return (
                  <div key={key} className={`px-4 py-3 ${voided ? 'opacity-50 bg-red-50/50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-zinc-500">{time}</span>
                          {seller && <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{seller}</span>}
                          {voided && <span className="text-[9px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded-full uppercase">Anulada</span>}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {items.map(i => (
                            <p key={i.id} className="text-[11px] text-zinc-600">
                              {getProductTitle(i.product_id)} x{Math.abs(i.quantity)}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{formatPrice(saleTotal)}</span>
                        {!voided && (
                          <button
                            onClick={() => initiateVoid(key, items)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Void PIN Modal - only for vendedores */}
      <Dialog open={voidModalOpen} onOpenChange={setVoidModalOpen}>
        <DialogContent className="max-w-sm rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-center flex items-center justify-center gap-2">
              <Lock size={18} className="text-red-500" /> Anular Venta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-zinc-500 text-center font-medium">Ingresá el PIN de supervisor para anular esta venta.</p>
            <input
              type="password"
              maxLength={4}
              placeholder="PIN"
              className="w-full text-center text-3xl font-black tracking-[0.5em] bg-zinc-100 border rounded-2xl py-4 outline-none focus:ring-2 focus:ring-red-500/30"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <button
              onClick={handleVoidWithPin}
              disabled={pin.length < 4 || voiding}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-zinc-300 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all"
            >
              {voiding ? 'Anulando...' : 'Confirmar Anulación'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
