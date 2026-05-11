import React, { useState, useRef, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Upload, Search, Package, FileSpreadsheet, Loader2, Boxes, Layers, Tag, AlertTriangle, XCircle, CheckCircle2, DollarSign, TrendingUp, QrCode, Edit3, X, Plus, Minus } from "lucide-react";
import ProductQRModal from "@/components/ProductQRModal";
import * as XLSX from 'xlsx';

const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

type StockFilter = 'all' | 'with' | 'low' | 'none';
type SortKey = 'title' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc' | 'recent';

const StockControlTab = () => {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [qrProduct, setQrProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortKey>('title');

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDelta, setEditDelta] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('title');
      if (error) throw error;
      return data;
    }
  });

  // Compute total stock per product (sum variants if available)
  const enriched = useMemo(() => {
    return products.map(p => {
      const variants = Array.isArray(p.variants) ? p.variants as any[] : [];
      const valid = variants.filter((v: any) => v.color && v.color !== 'Único');
      let variantStock = 0;
      valid.forEach((v: any) => {
        if (v.sizes && typeof v.sizes === 'object') {
          variantStock += (Object.values(v.sizes) as any[]).reduce<number>((s, q) => s + (Number(q) || 0), 0);
        } else {
          variantStock += Number(v.stock) || 0;
        }
      });
      const totalStock = valid.length > 0 ? variantStock : (p.stock ?? 0);
      return { ...p, _totalStock: totalStock, _variantsCount: valid.length };
    });
  }, [products]);

  const categories = useMemo(() => Array.from(new Set(enriched.map(p => p.category).filter(Boolean))).sort(), [enriched]);
  const brands = useMemo(() => Array.from(new Set(enriched.map(p => p.brand).filter(Boolean))).sort(), [enriched]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = enriched.filter(p => {
      if (q && !p.title.toLowerCase().includes(q) && !(p.barcode || '').toLowerCase().includes(q) && !(p.brand || '').toLowerCase().includes(q)) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (brandFilter && p.brand !== brandFilter) return false;
      const s = p._totalStock;
      if (stockFilter === 'with' && s <= 5) return false;
      if (stockFilter === 'low' && (s <= 0 || s > 5)) return false;
      if (stockFilter === 'none' && s > 0) return false;
      return true;
    });
    list.sort((a, b) => {
      switch (sort) {
        case 'stock-asc': return a._totalStock - b._totalStock;
        case 'stock-desc': return b._totalStock - a._totalStock;
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        case 'recent': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        default: return a.title.localeCompare(b.title);
      }
    });
    return list;
  }, [enriched, search, catFilter, brandFilter, stockFilter, sort]);

  // Global stats
  const stats = useMemo(() => {
    const totalProducts = enriched.length;
    const totalUnits = enriched.reduce((s, p) => s + p._totalStock, 0);
    const totalVariants = enriched.reduce((s, p) => s + p._variantsCount, 0);
    const retailValue = enriched.reduce((s, p) => s + p._totalStock * (Number(p.price) || 0), 0);
    const costValue = enriched.reduce((s, p) => s + p._totalStock * (Number(p.original_price) || 0), 0);
    const withStock = enriched.filter(p => p._totalStock > 5).length;
    const low = enriched.filter(p => p._totalStock > 0 && p._totalStock <= 5).length;
    const none = enriched.filter(p => p._totalStock <= 0).length;
    return { totalProducts, totalUnits, totalVariants, retailValue, costValue, withStock, low, none, brands: brands.length, categories: categories.length };
  }, [enriched, brands.length, categories.length]);

  const clearFilters = () => { setSearch(''); setCatFilter(''); setBrandFilter(''); setStockFilter('all'); setSort('title'); };
  const hasFilters = !!(search || catFilter || brandFilter || stockFilter !== 'all' || sort !== 'title');

  const handleSaveDelta = async (p: any) => {
    if (editDelta === 0) { setEditingId(null); return; }
    setSavingId(p.id);
    const newStock = Math.max(0, (p.stock || 0) + editDelta);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
    setSavingId(null);
    if (!error) {
      toast.success(`${p.title}: ${p.stock || 0} → ${newStock}`);
      setEditingId(null); setEditDelta(0);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } else toast.error("Error al actualizar");
  };

  // ============ Excel Export — todo de 10 ============
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const autoWidth = (rows: any[]) => rows.length === 0 ? undefined : Object.keys(rows[0]).map(key => ({
      wch: Math.min(Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2, 60)
    }));
    const sanitize = (name: string) => name.replace(/[\\/*?[\]:]/g, '').slice(0, 31) || 'Hoja';

    // Sheet 1: RESUMEN GLOBAL
    const resumen = [
      { Métrica: 'Productos cargados', Valor: stats.totalProducts },
      { Métrica: 'Variantes totales', Valor: stats.totalVariants },
      { Métrica: 'Categorías', Valor: stats.categories },
      { Métrica: 'Marcas', Valor: stats.brands },
      { Métrica: 'Unidades en stock', Valor: stats.totalUnits },
      { Métrica: 'Productos con stock', Valor: stats.withStock },
      { Métrica: 'Productos con stock bajo', Valor: stats.low },
      { Métrica: 'Productos sin stock', Valor: stats.none },
      { Métrica: 'Valor total a precio público (ARS)', Valor: Math.round(stats.retailValue) },
      { Métrica: 'Valor total a precio costo (ARS)', Valor: Math.round(stats.costValue) },
      { Métrica: 'Margen estimado (ARS)', Valor: Math.round(stats.retailValue - stats.costValue) },
      { Métrica: 'Fecha del reporte', Valor: new Date().toLocaleString('es-AR') },
    ];
    const wsRes = XLSX.utils.json_to_sheet(resumen);
    wsRes['!cols'] = autoWidth(resumen);
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen');

    // Sheet 2: PRODUCTOS COMPLETO (todos los campos)
    const productosFull = enriched.map(p => ({
      'ID': p.id,
      'Código de barras': p.barcode || '',
      'Título': p.title,
      'Slug': p.slug,
      'Marca': p.brand || '',
      'Categoría': p.category || '',
      'Descripción': p.description || '',
      'Precio Público': p.price ?? '',
      'Precio Costo': p.original_price ?? '',
      'Stock General': p.stock ?? 0,
      'Stock Total (incl. variantes)': p._totalStock,
      'Cantidad de Variantes': p._variantsCount,
      'Talles': (p.sizes || []).join(', '),
      'CC': (p.cc || []).join(', '),
      'Motos Compatibles': (p.moto_fit || []).join(', '),
      'Destacado': p.is_featured ? 'Sí' : 'No',
      'En Oferta': p.is_on_sale ? 'Sí' : 'No',
      'Envío Gratis': p.free_shipping ? 'Sí' : 'No',
      'Cantidad de Fotos': (p.images || []).length,
      'Fotos (NO EDITAR)': (p.images || []).join(' | '),
      'Creado': p.created_at ? new Date(p.created_at).toLocaleString('es-AR') : '',
    }));
    const wsProd = XLSX.utils.json_to_sheet(productosFull);
    wsProd['!cols'] = autoWidth(productosFull);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Productos');

    // Sheet 3: VARIANTES DETALLADAS (una fila por variante/talle)
    const variantesRows: any[] = [];
    enriched.forEach(p => {
      const variants = Array.isArray(p.variants) ? p.variants as any[] : [];
      const valid = variants.filter((v: any) => v.color && v.color !== 'Único');
      if (valid.length === 0) return;
      valid.forEach((v: any) => {
        const sizes = v.sizes && typeof v.sizes === 'object' ? Object.entries(v.sizes) : [];
        if (sizes.length > 0) {
          sizes.forEach(([size, qty]) => {
            variantesRows.push({
              'ID Producto': p.id, 'Código': p.barcode || '', 'Título': p.title,
              'Marca': p.brand || '', 'Categoría': p.category || '',
              'Color/Variante': v.color, 'Talle': size,
              'Stock': Number(qty) || 0,
              'Precio Variante': v.price || p.price,
              'Precio Costo': p.original_price ?? '',
              'Foto Variante': v.image || '',
            });
          });
        } else {
          variantesRows.push({
            'ID Producto': p.id, 'Código': p.barcode || '', 'Título': p.title,
            'Marca': p.brand || '', 'Categoría': p.category || '',
            'Color/Variante': v.color, 'Talle': '',
            'Stock': Number(v.stock) || 0,
            'Precio Variante': v.price || p.price,
            'Precio Costo': p.original_price ?? '',
            'Foto Variante': v.image || '',
          });
        }
      });
    });
    if (variantesRows.length > 0) {
      const wsVar = XLSX.utils.json_to_sheet(variantesRows);
      wsVar['!cols'] = autoWidth(variantesRows);
      XLSX.utils.book_append_sheet(wb, wsVar, 'Variantes');
    }

    // Sheet 4: POR CATEGORÍA — sub-hojas
    categories.forEach(cat => {
      const rows = productosFull.filter(r => r['Categoría'] === cat);
      if (rows.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = autoWidth(rows);
      XLSX.utils.book_append_sheet(wb, ws, sanitize(`Cat - ${cat}`));
    });

    // Sheet 5: ALERTAS — sin stock + stock bajo
    const alertas = enriched
      .filter(p => p._totalStock <= 5)
      .map(p => ({
        'Estado': p._totalStock <= 0 ? 'SIN STOCK' : 'STOCK BAJO',
        'ID': p.id, 'Código': p.barcode || '', 'Título': p.title,
        'Marca': p.brand || '', 'Categoría': p.category || '',
        'Stock Actual': p._totalStock, 'Precio Público': p.price,
      }));
    if (alertas.length > 0) {
      const wsAl = XLSX.utils.json_to_sheet(alertas);
      wsAl['!cols'] = autoWidth(alertas);
      XLSX.utils.book_append_sheet(wb, wsAl, 'Alertas');
    }

    XLSX.writeFile(wb, `inventario_rafaghelli_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Excel exportado — ${stats.totalProducts} productos, ${variantesRows.length} variantes`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const wb = XLSX.read(data, { type: 'array' });
      // Prefer "Productos" sheet if it exists
      const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('producto')) || wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) { toast.error("El archivo está vacío"); setImporting(false); return; }

      const firstRow = json[0];
      const keys = Object.keys(firstRow);
      const findCol = (patterns: string[]) => keys.find(k => patterns.some(p => k.toLowerCase().includes(p))) || null;

      const idCol = findCol(['id']);
      const stockCol = findCol(['stock general', 'stock', 'cant', 'existencia']);
      const priceCol = findCol(['precio pub', 'pvp', 'precio público', 'precio venta']);
      const costCol = findCol(['precio cost', 'costo']);
      const titleCol = findCol(['titulo', 'título', 'nombre', 'producto']);
      const barcodeCol = findCol(['codigo', 'código', 'barr', 'ean', 'sku']);

      if (!stockCol && !priceCol && !costCol) {
        toast.error("No se encontró columna de Stock ni Precio para actualizar");
        setImporting(false); return;
      }

      const titleMap = new Map<string, any>(), barcodeMap = new Map<string, any>(), idMap = new Map<string, any>();
      products.forEach(p => {
        idMap.set(p.id, p);
        titleMap.set(p.title.toLowerCase().trim(), p);
        if (p.barcode) barcodeMap.set(p.barcode.toLowerCase().trim(), p);
      });

      let updated = 0, notFound = 0, errors = 0;
      for (const row of json) {
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

  const StatCard = ({ icon: Icon, label, value, color = 'zinc' }: any) => (
    <div className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={`text-${color}-500`} />
        <p className={`text-[9px] font-black uppercase tracking-widest text-${color}-700`}>{label}</p>
      </div>
      <p className={`text-2xl font-black text-${color}-700`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Control de Stock</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {stats.totalProducts} productos · {stats.totalVariants} variantes · {stats.totalUnits} unidades
        </p>
      </div>

      {/* GLOBAL STATS */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Boxes size={24} className="text-yellow-400" />
          <h3 className="font-black uppercase tracking-tighter text-lg">Resumen General del Inventario</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Package} label="Productos" value={stats.totalProducts} color="zinc" />
          <StatCard icon={Layers} label="Variantes" value={stats.totalVariants} color="zinc" />
          <StatCard icon={Tag} label="Categorías" value={stats.categories} color="zinc" />
          <StatCard icon={Tag} label="Marcas" value={stats.brands} color="zinc" />
          <StatCard icon={Boxes} label="Unidades" value={stats.totalUnits} color="zinc" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-emerald-600" /><p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Valor a precio público</p></div>
            <p className="text-2xl font-black text-emerald-700">{formatPrice(stats.retailValue)}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-blue-600" /><p className="text-[9px] font-black uppercase tracking-widest text-blue-700">Valor a precio costo</p></div>
            <p className="text-2xl font-black text-blue-700">{formatPrice(stats.costValue)}</p>
          </div>
          <div className="bg-fuchsia-50 rounded-2xl p-4 border border-fuchsia-100">
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-fuchsia-600" /><p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-700">Margen estimado</p></div>
            <p className="text-2xl font-black text-fuchsia-700">{formatPrice(stats.retailValue - stats.costValue)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <div><p className="text-2xl font-black text-green-700">{stats.withStock}</p><p className="text-[9px] font-black uppercase text-green-700">Con stock</p></div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-500" />
            <div><p className="text-2xl font-black text-red-600">{stats.low}</p><p className="text-[9px] font-black uppercase text-red-600">Stock bajo (≤5)</p></div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-center gap-3">
            <XCircle size={20} className="text-red-600" />
            <div><p className="text-2xl font-black text-red-700">{stats.none}</p><p className="text-[9px] font-black uppercase text-red-700">Sin stock</p></div>
          </div>
        </div>
      </div>

      {/* IMPORT / EXPORT */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={24} className="text-yellow-400" />
          <h3 className="font-black uppercase tracking-tighter text-lg">Importar / Exportar</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-3 bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase text-sm hover:bg-zinc-800 transition-all shadow-lg">
            <Download size={20} /> Exportar Excel Completo
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center justify-center gap-3 border-2 border-dashed border-yellow-400 text-yellow-400 py-5 rounded-2xl font-black uppercase text-sm hover:bg-yellow-50 transition-all disabled:opacity-50">
            {importing ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            {importing ? 'Importando...' : 'Importar Excel/CSV'}
          </button>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleImportFile} />
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4 text-[11px] text-zinc-500 font-medium space-y-1">
          <p className="font-black uppercase text-zinc-700 text-xs mb-2">Excel exportado incluye:</p>
          <p>• <strong>Resumen</strong> — métricas globales del inventario</p>
          <p>• <strong>Productos</strong> — todos los campos (precio, costo, stock, fotos, descripción, motos, etc.)</p>
          <p>• <strong>Variantes</strong> — desglose por color y talle</p>
          <p>• <strong>Una hoja por categoría</strong></p>
          <p>• <strong>Alertas</strong> — productos sin stock o con stock bajo</p>
          <p className="text-emerald-600 font-black mt-2">🛡️ Las fotos nunca se modifican en importaciones</p>
        </div>
      </div>

      {/* FILTERS + LIST */}
      <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-yellow-400" />
            <h3 className="font-black uppercase tracking-tighter text-lg">Detalle de Productos</h3>
          </div>
          <p className="text-xs font-black uppercase text-zinc-500">{filtered.length} resultados</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, marca o código..."
              className="w-full bg-gray-50 border rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-yellow-400/20"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="md:col-span-2 bg-gray-50 border rounded-2xl px-3 py-3 text-xs font-black uppercase outline-none">
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="md:col-span-2 bg-gray-50 border rounded-2xl px-3 py-3 text-xs font-black uppercase outline-none">
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value as StockFilter)} className="md:col-span-2 bg-gray-50 border rounded-2xl px-3 py-3 text-xs font-black uppercase outline-none">
            <option value="all">Todo el stock</option>
            <option value="with">Con stock</option>
            <option value="low">Stock bajo</option>
            <option value="none">Sin stock</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="md:col-span-1 bg-gray-50 border rounded-2xl px-2 py-3 text-xs font-black uppercase outline-none">
            <option value="title">A-Z</option>
            <option value="stock-asc">Stock ↑</option>
            <option value="stock-desc">Stock ↓</option>
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
            <option value="recent">Recientes</option>
          </select>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs font-black uppercase text-yellow-400 hover:text-yellow-500 flex items-center gap-1">
            <X size={12} /> Limpiar filtros
          </button>
        )}

        {/* List */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-yellow-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-sm font-bold uppercase">No hay productos que coincidan</div>
        ) : (
          <div className="divide-y border rounded-2xl overflow-hidden">
            {filtered.map(p => {
              const s = p._totalStock;
              const stockColor = s <= 0 ? 'text-red-600 bg-red-50' : s <= 5 ? 'text-yellow-500 bg-yellow-50' : 'text-green-700 bg-green-50';
              const isEditing = editingId === p.id;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-zinc-50/50">
                  <img src={p.images?.[0] || '/placeholder.svg'} className="w-14 h-14 rounded-xl object-cover bg-zinc-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{p.brand}</p>
                      <p className="text-[9px] font-black text-zinc-400 uppercase">{p.category}</p>
                      {p._variantsCount > 0 && <span className="text-[9px] font-black bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full uppercase">{p._variantsCount} variantes</span>}
                      {p.is_on_sale && <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Oferta</span>}
                      {p.is_featured && <span className="text-[9px] font-black bg-fuchsia-100 text-fuchsia-600 px-2 py-0.5 rounded-full uppercase">Destacado</span>}
                    </div>
                    <p className="text-sm font-black text-zinc-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 mt-0.5">
                      {p.barcode && <span>Cód: {p.barcode}</span>}
                      <span>{formatPrice(p.price || 0)}</span>
                      {p.original_price ? <span className="text-zinc-400">Costo: {formatPrice(p.original_price)}</span> : null}
                    </div>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-center min-w-[70px] ${stockColor}`}>
                    <p className="text-[8px] font-black uppercase">Stock</p>
                    <p className="text-lg font-black leading-none">{s}</p>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
                      <button onClick={() => setEditDelta(d => d - 1)} className="w-8 h-8 rounded-lg bg-white text-red-500 flex items-center justify-center"><Minus size={14} /></button>
                      <span className={`w-10 text-center text-sm font-black ${editDelta > 0 ? 'text-green-600' : editDelta < 0 ? 'text-red-600' : 'text-zinc-600'}`}>{editDelta > 0 ? '+' : ''}{editDelta}</span>
                      <button onClick={() => setEditDelta(d => d + 1)} className="w-8 h-8 rounded-lg bg-white text-green-600 flex items-center justify-center"><Plus size={14} /></button>
                      <button onClick={() => handleSaveDelta(p)} disabled={savingId === p.id} className="bg-yellow-400 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg disabled:opacity-50">
                        {savingId === p.id ? '...' : 'OK'}
                      </button>
                      <button onClick={() => { setEditingId(null); setEditDelta(0); }} className="text-zinc-400 px-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(p.id); setEditDelta(0); }} className="text-zinc-400 hover:text-yellow-400 p-2" title="Ajustar stock">
                        <Edit3 size={16} />
                      </button>
                      {p.barcode && (
                        <button onClick={() => setQrProduct(p)} className="text-zinc-400 hover:text-yellow-400 p-2" title="Ver QR">
                          <QrCode size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ProductQRModal open={!!qrProduct} onOpenChange={(o) => !o && setQrProduct(null)} product={qrProduct} />
    </div>
  );
};

export default StockControlTab;
