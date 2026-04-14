import React, { useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2, XCircle, Loader2, Trash2, RefreshCw, ArrowDown, ArrowUp, Equal } from "lucide-react";
import * as XLSX from 'xlsx';

// --- Helpers (shared with UniversalImporter) ---

const cleanPrice = (raw: any): number | null => {
  if (raw == null || raw === '') return null;
  let s = String(raw).replace(/[^0-9.,-]/g, '').trim();
  if (!s) return null;
  const dotCount = (s.match(/\./g) || []).length;
  const commaCount = (s.match(/,/g) || []).length;
  if (commaCount === 1 && dotCount <= 1) {
    if (s.indexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (dotCount === 1 && commaCount === 0) {
    // already fine
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? null : n;
};

type ColumnMapping = {
  name: number | null;
  price: number | null;
  public_price: number | null;
  stock: number | null;
  barcode: number | null;
  category: number | null;
};

const FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: 'name', label: 'Nombre del producto' },
  { key: 'price', label: 'Precio Costo' },
  { key: 'public_price', label: 'Precio Público' },
  { key: 'stock', label: 'Stock' },
  { key: 'barcode', label: 'Código de barras' },
  { key: 'category', label: 'Categoría' },
];

type ChangeField = 'price' | 'original_price' | 'stock' | 'category';

interface ProductChange {
  productId: string;
  productTitle: string;
  matchedBy: 'title' | 'barcode';
  changes: {
    field: ChangeField;
    label: string;
    oldValue: any;
    newValue: any;
  }[];
  selected: boolean;
}

const ProductUpdater = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'review' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ name: null, price: null, public_price: null, stock: null, barcode: null, category: null });
  const [changes, setChanges] = useState<ProductChange[]>([]);
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<{ updated: number; errors: number } | null>(null);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // --- File handling ---
  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (json.length < 2) { toast.error("El archivo está vacío o no tiene datos"); return; }

        // Detect header row (first row with mostly text)
        const headerRow = json[0].map(h => String(h).trim());
        setHeaders(headerRow);
        setRows(json.slice(1).filter(r => r.some(cell => cell !== '')));

        // Auto-map columns
        const autoMap: ColumnMapping = { name: null, price: null, public_price: null, stock: null, barcode: null, category: null };
        headerRow.forEach((h, i) => {
          const hl = h.toLowerCase();
          if (/nombre|descripci[oó]n|producto|art[ií]culo|detalle/.test(hl) && autoMap.name === null) autoMap.name = i;
          else if (/p\.?\s*pub|precio\s*pub|pvp|venta|publico|público/.test(hl) && autoMap.public_price === null) autoMap.public_price = i;
          else if (/precio|costo|cost|lista/.test(hl) && autoMap.price === null) autoMap.price = i;
          else if (/stock|cant|existencia|inventario/.test(hl) && autoMap.stock === null) autoMap.stock = i;
          else if (/c[oó]d|barr|ean|upc|sku/.test(hl) && autoMap.barcode === null) autoMap.barcode = i;
          else if (/categ|rubro|grupo|familia|tipo/.test(hl) && autoMap.category === null) autoMap.category = i;
        });
        setMapping(autoMap);
        setStep('map');
        toast.success(`Archivo cargado: ${json.length - 1} filas`);
      } catch {
        toast.error("Error al leer el archivo");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // --- Compare logic ---
  const compareProducts = useCallback(() => {
    if (!products || products.length === 0) { toast.error("No hay productos cargados para comparar"); return; }

    // Build lookup maps
    const titleMap = new Map<string, any>();
    const barcodeMap = new Map<string, any>();
    products.forEach(p => {
      titleMap.set(p.title.toLowerCase().trim(), p);
      if (p.barcode) barcodeMap.set(p.barcode.toLowerCase().trim(), p);
    });

    const detectedChanges: ProductChange[] = [];

    rows.forEach(row => {
      const name = mapping.name != null ? String(row[mapping.name] ?? '').trim() : '';
      const barcode = mapping.barcode != null ? String(row[mapping.barcode] ?? '').trim() : '';
      if (!name && !barcode) return;

      // Try matching by barcode first, then title
      let match: any = null;
      let matchedBy: 'title' | 'barcode' = 'title';

      if (barcode) {
        match = barcodeMap.get(barcode.toLowerCase());
        if (match) matchedBy = 'barcode';
      }
      if (!match && name) {
        match = titleMap.get(name.toLowerCase());
        matchedBy = 'title';
      }

      if (!match) return;

      const changeList: ProductChange['changes'] = [];

      // Price (cost / original_price)
      if (mapping.price != null) {
        const newPrice = cleanPrice(row[mapping.price]);
        if (newPrice != null && newPrice !== Number(match.original_price)) {
          changeList.push({ field: 'original_price', label: 'Precio Costo', oldValue: match.original_price, newValue: newPrice });
        }
      }

      // Public price
      if (mapping.public_price != null) {
        const newPub = cleanPrice(row[mapping.public_price]);
        if (newPub != null && newPub !== Number(match.price)) {
          changeList.push({ field: 'price', label: 'Precio Público', oldValue: match.price, newValue: newPub });
        }
      }

      // Stock
      if (mapping.stock != null) {
        const newStock = parseInt(String(row[mapping.stock]));
        if (!isNaN(newStock) && newStock !== match.stock) {
          changeList.push({ field: 'stock', label: 'Stock', oldValue: match.stock, newValue: newStock });
        }
      }

      // Category
      if (mapping.category != null) {
        const newCat = String(row[mapping.category] ?? '').trim();
        if (newCat && newCat.toLowerCase() !== (match.category || '').toLowerCase()) {
          changeList.push({ field: 'category', label: 'Categoría', oldValue: match.category, newValue: newCat });
        }
      }

      if (changeList.length > 0) {
        detectedChanges.push({
          productId: match.id,
          productTitle: match.title,
          matchedBy,
          changes: changeList,
          selected: true,
        });
      }
    });

    setChanges(detectedChanges);
    setStep('review');

    if (detectedChanges.length === 0) {
      toast.info("No se encontraron diferencias con los productos cargados");
    } else {
      toast.success(`Se encontraron ${detectedChanges.length} productos con cambios`);
    }
  }, [products, rows, mapping]);

  // --- Apply updates ---
  const applyUpdates = async () => {
    const selected = changes.filter(c => c.selected);
    if (selected.length === 0) { toast.error("No hay cambios seleccionados"); return; }

    setUpdating(true);
    let updated = 0, errors = 0;

    for (const change of selected) {
      const updateObj: Record<string, any> = {};
      change.changes.forEach(c => { updateObj[c.field] = c.newValue; });

      const { error } = await supabase.from('products').update(updateObj).eq('id', change.productId);
      if (error) {
        console.error('Update error:', error);
        errors++;
      } else {
        updated++;
      }
    }

    setUpdating(false);
    setResult({ updated, errors });
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    toast.success(`Actualización completada: ${updated} productos actualizados`);
  };

  const toggleAll = (val: boolean) => setChanges(prev => prev.map(c => ({ ...c, selected: val })));
  const toggleOne = (idx: number) => setChanges(prev => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c));

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({ name: null, price: null, public_price: null, stock: null, barcode: null, category: null });
    setChanges([]);
    setResult(null);
  };

  const formatPrice = (n: number | null) =>
    n != null ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n) : '-';

  const stats = useMemo(() => {
    const selected = changes.filter(c => c.selected).length;
    const priceUp = changes.filter(c => c.selected && c.changes.some(ch => (ch.field === 'price' || ch.field === 'original_price') && ch.newValue > ch.oldValue)).length;
    const priceDown = changes.filter(c => c.selected && c.changes.some(ch => (ch.field === 'price' || ch.field === 'original_price') && ch.newValue < ch.oldValue)).length;
    return { selected, total: changes.length, priceUp, priceDown };
  }, [changes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Actualizador de Productos</h2>
        {step !== 'upload' && (
          <button onClick={reset} className="text-xs font-black uppercase text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Trash2 size={14} /> Reiniciar
          </button>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        {(['upload', 'map', 'review', 'done'] as const).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ArrowRight size={12} className="text-muted-foreground/40" />}
            <span className={`px-3 py-1.5 rounded-full transition-colors ${step === s ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'}`}>
              {s === 'upload' ? 'Subir' : s === 'map' ? 'Mapear' : s === 'review' ? 'Revisar' : 'Listo'}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* UPLOAD */}
      {step === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all"
        >
          <Upload size={40} className="mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-bold text-foreground">Arrastrá tu lista actualizada</p>
          <p className="text-sm text-muted-foreground mt-1">Excel o CSV con precios/stock nuevos</p>
          <p className="text-xs text-muted-foreground mt-3">Se comparará con los productos cargados y te mostrará las diferencias</p>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.tsv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* MAP */}
      {step === 'map' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet size={16} className="text-orange-500" />
            <span className="font-bold">{fileName}</span>
            <span className="text-muted-foreground">— {rows.length} filas</span>
          </div>

          <div className="bg-card border rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">Mapeá las columnas del archivo:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FIELDS.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {f.label} {f.key === 'name' && <span className="text-destructive">*</span>}
                  </label>
                  <select
                    value={mapping[f.key] ?? ''}
                    onChange={e => setMapping(prev => ({ ...prev, [f.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="">— No mapear —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview rows */}
          <div className="bg-card border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    {headers.slice(0, 8).map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-muted-foreground">{h || `Col ${i+1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className="border-t border-border">
                      {row.slice(0, 8).map((cell: any, ci: number) => (
                        <td key={ci} className="px-3 py-1.5 text-foreground">{String(cell).slice(0, 40)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={compareProducts}
            disabled={mapping.name === null}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-muted disabled:text-muted-foreground text-white font-black uppercase text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Comparar con productos cargados
          </button>
        </div>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="space-y-4">
          {changes.length === 0 ? (
            <div className="text-center py-12">
              <Equal size={40} className="mx-auto mb-4 text-green-500" />
              <p className="text-lg font-bold">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground">No se encontraron diferencias entre el archivo y los productos cargados.</p>
              <button onClick={reset} className="mt-4 text-sm font-bold text-orange-500 hover:underline">Intentar con otro archivo</button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{stats.total}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Con cambios</div>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-orange-500">{stats.selected}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Seleccionados</div>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-red-500">{stats.priceUp}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-center gap-1"><ArrowUp size={10} /> Subieron</div>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-green-500">{stats.priceDown}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-center gap-1"><ArrowDown size={10} /> Bajaron</div>
                </div>
              </div>

              {/* Select all / none */}
              <div className="flex gap-2">
                <button onClick={() => toggleAll(true)} className="text-xs font-bold text-orange-500 hover:underline">Seleccionar todos</button>
                <span className="text-muted-foreground">|</span>
                <button onClick={() => toggleAll(false)} className="text-xs font-bold text-muted-foreground hover:underline">Deseleccionar todos</button>
              </div>

              {/* Changes list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {changes.map((change, idx) => (
                  <div
                    key={change.productId}
                    className={`border rounded-xl p-3 transition-all cursor-pointer ${change.selected ? 'bg-orange-50 border-orange-300' : 'bg-card border-border opacity-60'}`}
                    onClick={() => toggleOne(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={change.selected}
                        onChange={() => toggleOne(idx)}
                        className="mt-1 accent-orange-500"
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-foreground truncate">{change.productTitle}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${change.matchedBy === 'barcode' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                            {change.matchedBy === 'barcode' ? 'Código' : 'Nombre'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {change.changes.map((ch, ci) => {
                            const isPrice = ch.field === 'price' || ch.field === 'original_price';
                            const went = isPrice ? (ch.newValue > ch.oldValue ? 'up' : ch.newValue < ch.oldValue ? 'down' : 'same') : 'same';
                            return (
                              <div key={ci} className="text-xs">
                                <span className="text-muted-foreground">{ch.label}: </span>
                                <span className="line-through text-muted-foreground/70">{isPrice ? formatPrice(ch.oldValue) : ch.oldValue ?? '-'}</span>
                                <span className="mx-1">→</span>
                                <span className={`font-bold ${went === 'up' ? 'text-red-600' : went === 'down' ? 'text-green-600' : 'text-foreground'}`}>
                                  {isPrice ? formatPrice(ch.newValue) : ch.newValue}
                                </span>
                                {went === 'up' && <ArrowUp size={10} className="inline ml-0.5 text-red-500" />}
                                {went === 'down' && <ArrowDown size={10} className="inline ml-0.5 text-green-500" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Apply button */}
              <button
                onClick={applyUpdates}
                disabled={updating || stats.selected === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-muted disabled:text-muted-foreground text-white font-black uppercase text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {updating ? <><Loader2 size={16} className="animate-spin" /> Actualizando...</> : <><RefreshCw size={16} /> Actualizar {stats.selected} productos</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* DONE */}
      {step === 'done' && result && (
        <div className="text-center py-12 space-y-4">
          {result.errors === 0 ? (
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
          ) : (
            <XCircle size={48} className="mx-auto text-destructive" />
          )}
          <div>
            <p className="text-xl font-black">{result.updated} productos actualizados</p>
            {result.errors > 0 && <p className="text-sm text-destructive">{result.errors} errores</p>}
          </div>
          <button onClick={reset} className="text-sm font-bold text-orange-500 hover:underline">Actualizar otro archivo</button>
        </div>
      )}
    </div>
  );
};

export default ProductUpdater;
