import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, X, Plus, Minus, Download, Upload, Search, Package, FileSpreadsheet, Loader2, DollarSign, Users, QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import ProductQRModal from "@/components/ProductQRModal";
import * as XLSX from 'xlsx';

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const StockControlTab = () => {
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [stockDelta, setStockDelta] = useState(0);
  const [saving, setSaving] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [qrProduct, setQrProduct] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('title');
      if (error) throw error;
      return data;
    }
  });

  // Today's movements for daily sales summary
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayMovements = [] } = useQuery({
    queryKey: ['admin-today-movements', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('movement_type', 'venta')
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Daily sales summary
  const dailySummary = useMemo(() => {
    const totalRevenue = todayMovements.reduce((sum, m) => {
      const product = products.find(p => p.id === m.product_id);
      return sum + Math.abs(m.quantity) * (product?.price ?? 0);
    }, 0);

    const bySeller: Record<string, number> = {};
    todayMovements.forEach(m => {
      const seller = (m as any).seller_name || 'Sin identificar';
      const product = products.find(p => p.id === m.product_id);
      const amount = Math.abs(m.quantity) * (product?.price ?? 0);
      bySeller[seller] = (bySeller[seller] || 0) + amount;
    });

    return { totalRevenue, bySeller, totalSales: todayMovements.length };
  }, [todayMovements, products]);

  const startScanner = useCallback(() => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("scanner-container");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            handleScanResult(decodedText);
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        console.error("Error al abrir cámara:", err);
        toast.error("No se pudo acceder a la cámara. Verificá los permisos.");
        setScanning(false);
      }
    }, 100);
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const handleScanResult = async (code: string) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .or(`barcode.eq.${code},id.eq.${code}`)
      .limit(1)
      .maybeSingle();
    if (data) {
      setScannedProduct(data);
      setStockDelta(0);
    } else {
      toast.error(`No se encontró producto con código: ${code}`);
    }
  };

  const handleManualSearch = () => {
    if (!manualSearch.trim()) return;
    const found = products.find(p =>
      p.title.toLowerCase().includes(manualSearch.toLowerCase()) ||
      p.barcode === manualSearch ||
      p.id === manualSearch
    );
    if (found) {
      setScannedProduct(found);
      setStockDelta(0);
      setManualSearch('');
    } else {
      toast.error("Producto no encontrado");
    }
  };

  const handleUpdateStock = async () => {
    if (!scannedProduct || stockDelta === 0) return;
    setSaving(true);
    const newStock = Math.max(0, (scannedProduct.stock || 0) + stockDelta);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', scannedProduct.id);
    setSaving(false);
    if (!error) {
      toast.success(`Stock actualizado: ${scannedProduct.stock} → ${newStock}`);
      setScannedProduct({ ...scannedProduct, stock: newStock });
      setStockDelta(0);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } else {
      toast.error("Error al actualizar stock");
    }
  };

  const handleExportExcel = () => {
    // Build a flat row per product with all relevant data
    const rows = products.map(p => {
      const variants = Array.isArray(p.variants) ? p.variants as any[] : [];
      const colors = variants.filter((v: any) => v.color && v.color !== 'Único').map((v: any) => {
        const parts = [v.color];
        if (v.price) parts.push(`$${v.price}`);
        const sizes = v.sizes ? Object.entries(v.sizes).filter(([s]) => s !== 'Único').map(([s, qty]) => `${s}(${qty})`).join(',') : '';
        if (sizes) parts.push(`T:${sizes}`);
        if (v.stock != null) parts.push(`Stk:${v.stock}`);
        if (v.moto_fit?.length) parts.push(`Moto:${v.moto_fit.join(',')}`);
        return parts.join(' | ');
      });

      return {
        'ID': p.id,
        'Código': p.barcode || '',
        'Título': p.title,
        'Marca': p.brand || '',
        'Categoría': p.category || '',
        'Precio Público': p.price,
        'Precio Costo': p.original_price ?? '',
        'Stock': p.stock ?? 0,
        'Motos Compatibles': (p.moto_fit || []).join(', '),
        'Talles': (p.sizes || []).join(', '),
        'Variantes (Color)': colors.join(' // '),
        'Envío Gratis': p.free_shipping ? 'Sí' : 'No',
        'En Oferta': p.is_on_sale ? 'Sí' : 'No',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map(key => {
      const maxLen = Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length));
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_rafaghelli_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exportado correctamente");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) { toast.error("El archivo está vacío"); setImporting(false); return; }

      // Detect columns (flexible naming)
      const firstRow = json[0];
      const keys = Object.keys(firstRow);
      const findCol = (patterns: string[]) => keys.find(k => patterns.some(p => k.toLowerCase().includes(p))) || null;

      const idCol = findCol(['id']);
      const stockCol = findCol(['stock', 'cant', 'existencia']);
      const priceCol = findCol(['precio pub', 'pvp', 'precio público', 'precio venta', 'p. pub']);
      const costCol = findCol(['precio cost', 'costo', 'precio lista', 'p. cost']);
      const titleCol = findCol(['titulo', 'título', 'nombre', 'producto']);
      const barcodeCol = findCol(['codigo', 'código', 'barr', 'ean', 'sku']);

      if (!stockCol && !priceCol && !costCol) {
        toast.error("No se encontró columna de Stock ni de Precio para actualizar");
        setImporting(false);
        return;
      }

      // Build lookup maps for matching
      const titleMap = new Map<string, any>();
      const barcodeMap = new Map<string, any>();
      const idMap = new Map<string, any>();
      products.forEach(p => {
        idMap.set(p.id, p);
        titleMap.set(p.title.toLowerCase().trim(), p);
        if (p.barcode) barcodeMap.set(p.barcode.toLowerCase().trim(), p);
      });

      let updated = 0, notFound = 0, errors = 0;

      for (const row of json) {
        // Try to match: by ID, then barcode, then title
        let match: any = null;
        if (idCol && row[idCol]) match = idMap.get(String(row[idCol]).trim());
        if (!match && barcodeCol && row[barcodeCol]) match = barcodeMap.get(String(row[barcodeCol]).toLowerCase().trim());
        if (!match && titleCol && row[titleCol]) match = titleMap.get(String(row[titleCol]).toLowerCase().trim());

        if (!match) { notFound++; continue; }

        const updateData: any = {};
        if (stockCol && row[stockCol] != null) {
          const val = parseInt(String(row[stockCol]));
          if (!isNaN(val)) updateData.stock = val;
        }
        if (priceCol && row[priceCol] != null) {
          const val = parseFloat(String(row[priceCol]).replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (!isNaN(val)) updateData.price = val;
        }
        if (costCol && row[costCol] != null) {
          const val = parseFloat(String(row[costCol]).replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (!isNaN(val)) updateData.original_price = val;
        }

        if (Object.keys(updateData).length === 0) continue;

        const { error } = await supabase.from('products').update(updateData).eq('id', match.id);
        if (error) errors++; else updated++;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      const msg = [`${updated} actualizados`];
      if (notFound) msg.push(`${notFound} no encontrados`);
      if (errors) msg.push(`${errors} errores`);
      toast.success(`Importación: ${msg.join(', ')}`);
    } catch {
      toast.error("Error al leer el archivo");
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Control de Stock</h1>

      {/* Daily Sales Summary */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-green-500" />
          <h3 className="font-black uppercase tracking-tighter text-lg">Ventas del Día</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <p className="text-[10px] font-black uppercase text-green-700 mb-1">Total Recaudado</p>
            <p className="text-3xl font-black text-green-600">{formatPrice(dailySummary.totalRevenue)}</p>
          </div>
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
            <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Operaciones</p>
            <p className="text-3xl font-black text-zinc-800">{dailySummary.totalSales}</p>
          </div>
        </div>

        {Object.keys(dailySummary.bySeller).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-zinc-400" />
              <p className="text-xs font-black uppercase text-zinc-500">Desglose por Vendedor</p>
            </div>
            <div className="space-y-2">
              {Object.entries(dailySummary.bySeller).sort(([,a],[,b]) => b - a).map(([seller, amount]) => (
                <div key={seller} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-3 border">
                  <span className="text-xs font-bold text-zinc-600 truncate">{seller}</span>
                  <span className="text-sm font-black text-zinc-900">{formatPrice(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scanner Section */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Camera size={24} className="text-orange-500" />
          <h3 className="font-black uppercase tracking-tighter text-lg">Escáner de Productos</h3>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre, código o ID..."
              className="w-full bg-gray-50 border rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              value={manualSearch}
              onChange={e => setManualSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            />
          </div>
          <button onClick={handleManualSearch} className="bg-zinc-900 text-white px-6 rounded-2xl font-black uppercase text-xs">Buscar</button>
        </div>
        <div className="flex gap-3">
          {!scanning ? (
            <button onClick={startScanner} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
              <Camera size={20} /> Abrir Escáner
            </button>
          ) : (
            <button onClick={stopScanner} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-all">
              <X size={20} /> Cerrar Escáner
            </button>
          )}
        </div>
        {scanning && (
          <div className="rounded-2xl overflow-hidden border bg-black aspect-video max-w-lg mx-auto">
            <div id="scanner-container" className="w-full h-full" />
          </div>
        )}
        {scannedProduct && (
          <div className="bg-zinc-50 rounded-[24px] border-2 border-orange-500/20 p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <img src={scannedProduct.images?.[0] || '/placeholder.svg'} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{scannedProduct.brand}</p>
                  <h4 className="font-black uppercase text-sm">{scannedProduct.title}</h4>
                  {scannedProduct.barcode && (
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">Código: {scannedProduct.barcode}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {scannedProduct.barcode && (
                  <button onClick={() => setQrProduct(scannedProduct)} className="text-orange-500 hover:text-orange-600" title="Ver QR">
                    <QrCode size={20} />
                  </button>
                )}
                <button onClick={() => { setScannedProduct(null); setStockDelta(0); }} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 py-4">
              <button onClick={() => setStockDelta(d => d - 1)} className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors">
                <Minus size={24} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-zinc-400">Stock actual</p>
                <p className="text-4xl font-black text-zinc-900">{(scannedProduct.stock || 0) + stockDelta}</p>
                {stockDelta !== 0 && (
                  <p className={`text-sm font-black ${stockDelta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stockDelta > 0 ? '+' : ''}{stockDelta}
                  </p>
                )}
              </div>
              <button onClick={() => setStockDelta(d => d + 1)} className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                <Plus size={24} />
              </button>
            </div>
            <button
              onClick={handleUpdateStock}
              disabled={stockDelta === 0 || saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-300 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-lg shadow-orange-500/20 disabled:shadow-none"
            >
              {saving ? "Guardando..." : "Actualizar Stock"}
            </button>
          </div>
        )}
      </div>

      {/* Import / Export */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={24} className="text-orange-500" />
          <h3 className="font-black uppercase tracking-tighter text-lg">Importar / Exportar</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-3 bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase text-sm hover:bg-zinc-800 transition-all shadow-lg">
            <Download size={20} /> Exportar CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center justify-center gap-3 border-2 border-dashed border-orange-500 text-orange-500 py-5 rounded-2xl font-black uppercase text-sm hover:bg-orange-50 transition-all disabled:opacity-50">
            {importing ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            {importing ? 'Importando...' : 'Importar CSV'}
          </button>
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4 text-[11px] text-zinc-500 font-medium space-y-1">
          <p className="font-black uppercase text-zinc-700 text-xs mb-2">Formato del CSV:</p>
          <p>• Columnas obligatorias: <strong>ID, Stock</strong></p>
          <p>• Columnas opcionales: Título, Código de Barras, Precio, Categoría, Marca</p>
          <p>• Podés exportar primero para obtener la plantilla con los IDs correctos</p>
        </div>
        <div>
          <h4 className="font-black uppercase text-xs tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Package size={14} /> Resumen de Stock</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
              <p className="text-2xl font-black text-green-600">{products.filter(p => (p.stock ?? 0) > 5).length}</p>
              <p className="text-[9px] font-black uppercase text-green-700">Con stock</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
              <p className="text-2xl font-black text-orange-600">{products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length}</p>
              <p className="text-[9px] font-black uppercase text-orange-700">Stock bajo</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
              <p className="text-2xl font-black text-red-600">{products.filter(p => (p.stock ?? 0) <= 0).length}</p>
              <p className="text-[9px] font-black uppercase text-red-700">Sin stock</p>
            </div>
          </div>
        </div>
      </div>

      <ProductQRModal open={!!qrProduct} onOpenChange={(o) => !o && setQrProduct(null)} product={qrProduct} />
    </div>
  );
};

export default StockControlTab;
