import React, { useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Eye, Database, ArrowRight, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';

// --- Data Sanitization ---

const cleanPrice = (raw: any): number | null => {
  if (raw == null || raw === '') return null;
  let s = String(raw).replace(/[^0-9.,\-]/g, '').trim();
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    // 15.400,50 → comma is decimal, dots are thousands
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // 15,400.50 → dot is decimal, commas are thousands
    s = s.replace(/,/g, '');
  } else if (lastDot !== -1 && lastComma === -1) {
    // Only dots, no commas: e.g. 53.528 → Argentine thousands separator
    // If digits after last dot are exactly 3, treat dot as thousands separator
    const afterDot = s.substring(lastDot + 1);
    if (afterDot.length === 3) {
      s = s.replace(/\./g, '');
    }
    // else: e.g. 53.52 → treat dot as decimal (2 digits after)
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
};

const cleanStock = (raw: any): { stock: number; available: boolean } => {
  if (raw == null || raw === '') return { stock: 0, available: false };
  const s = String(raw).trim().toLowerCase();
  if (['agotado', 'no disponible', 'no', 'false', '0', 'sin stock', 'out of stock'].includes(s))
    return { stock: 0, available: false };
  const n = parseInt(s);
  if (!isNaN(n)) return { stock: Math.max(0, n), available: n > 0 };
  return { stock: 1, available: true };
};

const inferCategoryRows = (
  rows: any[][],
  headers: string[],
  mappedCols: Record<string, number>
): { processedRows: any[][]; inferredCategories: Record<number, string> } => {
  const inferredCategories: Record<number, string> = {};
  let currentCategory = '';
  const nameIdx = mappedCols['name'] ?? -1;
  const priceIdx = mappedCols['price'] ?? -1;

  rows.forEach((row, i) => {
    const nonEmpty = row.filter((c, ci) => c != null && String(c).trim() !== '' && ci < headers.length);
    const firstVal = String(row[0] ?? '').trim();
    // Row is a category separator if only 1-2 cells have content, no price-like value
    if (firstVal && nonEmpty.length <= 2 && (priceIdx === -1 || !row[priceIdx] || cleanPrice(row[priceIdx]) === null)) {
      const hasName = nameIdx !== -1 && row[nameIdx] && String(row[nameIdx]).trim();
      if (!hasName || nonEmpty.length === 1) {
        currentCategory = firstVal.toUpperCase();
        return;
      }
    }
    if (currentCategory) inferredCategories[i] = currentCategory;
  });

  return { processedRows: rows, inferredCategories };
};

// --- DB field definitions ---
const DB_FIELDS = [
  { key: 'barcode', label: 'SKU / Código', required: false },
  { key: 'name', label: 'Nombre del Producto', required: true },
  { key: 'price', label: 'Precio de Lista', required: true },
  { key: 'public_price', label: 'Precio Público', required: false },
  { key: 'category', label: 'Categoría', required: false },
  { key: 'color', label: 'Color', required: false },
  { key: 'stock', label: 'Stock / Disponibilidad', required: false },
] as const;

type MappingKey = typeof DB_FIELDS[number]['key'];

const UniversalImporter = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<MappingKey, number | null>>({
    barcode: null, name: null, price: null, public_price: null, category: null, color: null, stock: null,
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: number; skipped: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // --- File reading ---
  const readFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let parsedHeaders: string[] = [];
    let parsedRows: any[][] = [];

    if (ext === 'csv') {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("El archivo está vacío"); return; }
      // Auto-detect delimiter: use the one that appears most in the header
      const headerLine = lines[0];
      const semicolons = (headerLine.match(/;/g) || []).length;
      const commas = (headerLine.match(/,/g) || []).length;
      const tabs = (headerLine.match(/\t/g) || []).length;
      const delimiter = semicolons >= commas && semicolons >= tabs ? ';' : tabs > commas ? '\t' : ',';
      parsedHeaders = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, ''));
      parsedRows = lines.slice(1).map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')));
    } else if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (json.length < 2) { toast.error("El archivo está vacío"); return; }
      parsedHeaders = json[0].map((h: any) => String(h).trim());
      parsedRows = json.slice(1);
    } else {
      toast.error("Formato no soportado. Usá CSV o Excel (.xlsx)");
      return;
    }

    setFileName(file.name);
    setHeaders(parsedHeaders);
    setRows(parsedRows);

    // Auto-map by guessing column names
    const autoMap: Record<MappingKey, number | null> = {
      barcode: null, name: null, price: null, public_price: null, category: null, color: null, stock: null,
    };
    parsedHeaders.forEach((h, i) => {
      const hl = h.toLowerCase();
      if (/sku|c[oó]digo|barcode|cod|art[ií]culo/.test(hl) && autoMap.barcode === null) autoMap.barcode = i;
      else if (/nombre|descripci[oó]n|producto|title|name|detalle/.test(hl) && autoMap.name === null) autoMap.name = i;
      else if (/precio.*p[uú]b|p\.?v\.?p|venta|público|public/.test(hl) && autoMap.public_price === null) autoMap.public_price = i;
      else if (/precio|price|lista|costo|valor/.test(hl) && autoMap.price === null) autoMap.price = i;
      else if (/categ|rubro|familia|grupo|linea|l[ií]nea/.test(hl) && autoMap.category === null) autoMap.category = i;
      else if (/color|colour/.test(hl) && autoMap.color === null) autoMap.color = i;
      else if (/stock|cantidad|disp|exist|qty|inventory/.test(hl) && autoMap.stock === null) autoMap.stock = i;
    });
    setMapping(autoMap);
    setStep('map');
    toast.success(`Archivo leído: ${parsedHeaders.length} columnas, ${parsedRows.length} filas`);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [readFile]);

  // --- Preview data ---
  const previewData = useMemo(() => {
    if (step !== 'map' && step !== 'preview') return [];
    const mappedCols: Record<string, number> = {};
    Object.entries(mapping).forEach(([k, v]) => { if (v !== null) mappedCols[k] = v; });

    const { inferredCategories } = inferCategoryRows(rows, headers, mappedCols);

    return rows.map((row, idx) => {
      const nameVal = mappedCols['name'] != null ? String(row[mappedCols['name']] ?? '').trim() : '';
      if (!nameVal) return null;

      const priceRaw = mappedCols['price'] != null ? row[mappedCols['price']] : null;
      const pubPriceRaw = mappedCols['public_price'] != null ? row[mappedCols['public_price']] : null;
      const stockRaw = mappedCols['stock'] != null ? row[mappedCols['stock']] : null;
      const barcodeRaw = mappedCols['barcode'] != null ? String(row[mappedCols['barcode']] ?? '').trim() : '';
      const categoryRaw = mappedCols['category'] != null ? String(row[mappedCols['category']] ?? '').trim() : '';
      const colorRaw = mappedCols['color'] != null ? String(row[mappedCols['color']] ?? '').trim() : '';

      const price = cleanPrice(priceRaw);
      const pubPrice = cleanPrice(pubPriceRaw);
      const { stock, available } = cleanStock(stockRaw);
      const barcode = barcodeRaw || `RFM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const category = categoryRaw || inferredCategories[idx] || 'Sin categoría';
      const color = colorRaw && colorRaw.toLowerCase() !== 'n/a' ? colorRaw : '';

      return {
        barcode,
        name: nameVal,
        price: price ?? 0,
        public_price: pubPrice ?? price ?? 0,
        category,
        color,
        stock,
        available,
        _generated: !barcodeRaw,
      };
    }).filter(Boolean);
  }, [rows, headers, mapping, step]);

  // --- Import to Supabase ---
  const handleImport = async () => {
    if (previewData.length === 0) { toast.error("No hay datos para importar"); return; }
    setImporting(true);
    let inserted = 0, errors = 0, skipped = 0;

    // Fetch existing product titles from DB to detect duplicates
    const { data: existingProducts } = await supabase.from('products').select('title');
    const existingTitles = new Set(
      (existingProducts || []).map((p: any) => p.title?.toLowerCase().trim())
    );

    // Build full dataset (not just preview slice)
    const mappedCols: Record<string, number> = {};
    Object.entries(mapping).forEach(([k, v]) => { if (v !== null) mappedCols[k] = v; });
    const { inferredCategories } = inferCategoryRows(rows, headers, mappedCols);

    const batch: any[] = [];
    const seenInFile = new Set<string>();

    rows.forEach((row, idx) => {
      const nameVal = mappedCols['name'] != null ? String(row[mappedCols['name']] ?? '').trim() : '';
      if (!nameVal) return;

      const normalizedName = nameVal.toLowerCase().trim();

      // Skip duplicates: already in DB or already seen in this file
      if (existingTitles.has(normalizedName) || seenInFile.has(normalizedName)) {
        skipped++;
        return;
      }
      seenInFile.add(normalizedName);

      const priceRaw = mappedCols['price'] != null ? row[mappedCols['price']] : null;
      const pubPriceRaw = mappedCols['public_price'] != null ? row[mappedCols['public_price']] : null;
      const stockRaw = mappedCols['stock'] != null ? row[mappedCols['stock']] : null;
      const barcodeRaw = mappedCols['barcode'] != null ? String(row[mappedCols['barcode']] ?? '').trim() : '';
      const categoryRaw = mappedCols['category'] != null ? String(row[mappedCols['category']] ?? '').trim() : '';
      const colorRaw = mappedCols['color'] != null ? String(row[mappedCols['color']] ?? '').trim() : '';

      const price = cleanPrice(priceRaw);
      const pubPrice = cleanPrice(pubPriceRaw);
      const { stock } = cleanStock(stockRaw);
      const barcode = barcodeRaw || `RFM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const category = categoryRaw || inferredCategories[idx] || 'Sin categoría';
      const color = colorRaw && colorRaw.toLowerCase() !== 'n/a' ? colorRaw : '';
      const slug = nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      batch.push({
        title: nameVal,
        slug: `${slug}-${barcode.slice(-5).toLowerCase()}`,
        barcode,
        price: pubPrice ?? price ?? 0,
        original_price: price ?? 0,
        category,
        brand: 'Importado',
        stock,
        description: color ? `Color: ${color}` : null,
        images: [],
      });
    });

    // Insert in chunks of 50
    for (let i = 0; i < batch.length; i += 50) {
      const chunk = batch.slice(i, i + 50);
      const { error } = await supabase.from('products').insert(chunk);
      if (error) {
        console.error('Chunk error:', error);
        errors += chunk.length;
      } else {
        inserted += chunk.length;
      }
    }

    setImporting(false);
    setImportResult({ inserted, errors });
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    const skipMsg = skipped > 0 ? ` (${skipped} duplicados omitidos)` : '';
    toast.success(`Importación finalizada: ${inserted} productos insertados${skipMsg}`);
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({ barcode: null, name: null, price: null, public_price: null, category: null, color: null, stock: null });
    setImportResult(null);
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Importador Universal</h2>
        {step !== 'upload' && (
          <button onClick={reset} className="text-xs font-black uppercase text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
            <Trash2 size={14} /> Reiniciar
          </button>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        {(['upload', 'map', 'preview', 'done'] as const).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ArrowRight size={12} className="text-zinc-300" />}
            <span className={`px-3 py-1.5 rounded-full transition-colors ${step === s ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
              {s === 'upload' ? 'Subir' : s === 'map' ? 'Mapear' : s === 'preview' ? 'Preview' : 'Listo'}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-[32px] p-12 md:p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${dragOver ? 'border-orange-500 bg-orange-50' : 'border-zinc-300 bg-zinc-50 hover:border-orange-400 hover:bg-orange-50/50'}`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${dragOver ? 'bg-orange-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
            <Upload size={28} />
          </div>
          <div className="text-center">
            <p className="font-black uppercase text-sm text-zinc-700">Arrastrá tu archivo acá</p>
            <p className="text-xs text-zinc-400 mt-1">CSV o Excel (.xlsx) — Listas de precios de cualquier proveedor</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
        </div>
      )}

      {/* STEP 2: Mapping */}
      {(step === 'map' || step === 'preview') && (
        <>
          <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-orange-500" />
              <div>
                <h3 className="font-black uppercase tracking-tighter text-sm">Mapeo de Columnas</h3>
                <p className="text-[10px] text-zinc-400 font-medium">{fileName} — {rows.length} filas detectadas</p>
              </div>
            </div>

            <div className="space-y-3">
              {DB_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3 bg-zinc-50 rounded-2xl p-3 border">
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Database size={14} className="text-orange-500 flex-shrink-0" />
                    <span className="text-xs font-black uppercase text-zinc-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  </div>
                  <ArrowRight size={14} className="text-zinc-300 flex-shrink-0" />
                  <select
                    value={mapping[field.key] ?? ''}
                    onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                    className="flex-1 bg-white border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">— No mapear —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Sample from file */}
            {headers.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-2">Muestra del archivo (primeras 3 filas)</p>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100">
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-black uppercase text-zinc-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 3).map((row, ri) => (
                        <tr key={ri} className="border-t">
                          {headers.map((_, ci) => (
                            <td key={ci} className="px-3 py-2 text-zinc-600 whitespace-nowrap max-w-[200px] truncate">{String(row[ci] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (mapping.name === null) { toast.error("Mapeá al menos el campo 'Nombre del Producto'"); return; }
                setStep('preview');
              }}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <Eye size={18} /> Ver Vista Previa
            </button>
          </div>

          {/* STEP 3: Preview */}
          {step === 'preview' && previewData.length > 0 && (
            <div className="bg-white rounded-[32px] border p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye size={20} className="text-orange-500" />
                  <h3 className="font-black uppercase tracking-tighter text-sm">
                    Vista Previa ({Math.min(5, previewData.length)} de {previewData.length} productos)
                  </h3>
                </div>
                <button onClick={() => setStep('map')} className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-600">
                  ← Volver a mapear
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-zinc-100">
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Código</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Producto</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Precio</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Categoría</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Color</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((item: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-zinc-50">
                        <td className="px-3 py-2.5 font-mono text-zinc-500">
                          {item.barcode.length > 16 ? item.barcode.slice(0, 16) + '…' : item.barcode}
                          {item._generated && (
                            <span className="ml-1 bg-blue-100 text-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">AUTO</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-zinc-800 max-w-[200px] truncate">{item.name}</td>
                        <td className="px-3 py-2.5 font-black text-zinc-900">{formatPrice(item.public_price || item.price)}</td>
                        <td className="px-3 py-2.5">
                          <span className="bg-zinc-100 text-zinc-600 text-[9px] font-black uppercase px-2 py-1 rounded-full">{item.category}</span>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-600 text-xs">{item.color || '—'}</td>
                        <td className="px-3 py-2.5">
                          {item.available ? (
                            <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                              <CheckCircle2 size={10} /> {item.stock}
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-600 text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                              <XCircle size={10} /> Sin stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-300 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-lg shadow-orange-500/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {importing ? (
                  <><Loader2 size={18} className="animate-spin" /> Importando...</>
                ) : (
                  <><Database size={18} /> Importar {previewData.length} Productos</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* STEP 4: Done */}
      {step === 'done' && importResult && (
        <div className="bg-white rounded-[32px] border p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <div>
            <h3 className="font-black uppercase text-xl tracking-tighter">Importación Completa</h3>
            <p className="text-sm text-zinc-500 mt-2">
              <span className="font-black text-green-600">{importResult.inserted}</span> productos insertados
              {importResult.errors > 0 && (
                <>, <span className="font-black text-red-500">{importResult.errors}</span> errores</>
              )}
            </p>
          </div>
          <button onClick={reset} className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-sm hover:bg-zinc-800 transition-all">
            Importar Otro Archivo
          </button>
        </div>
      )}
    </div>
  );
};

export default UniversalImporter;
