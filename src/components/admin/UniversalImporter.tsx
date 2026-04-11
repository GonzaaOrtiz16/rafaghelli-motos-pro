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
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    s = s.replace(/,/g, '');
  } else if (lastDot !== -1 && lastComma === -1) {
    const afterDot = s.substring(lastDot + 1);
    if (afterDot.length === 3) {
      s = s.replace(/\./g, '');
    }
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

// --- Color dictionary for smart detection ---
const COLOR_WORDS = new Set([
  'red','blue','green','yellow','orange','black','white','grey','gray','pink','purple',
  'brown','beige','navy','silver','gold','cyan','magenta','turquoise','violet','coral',
  'maroon','olive','teal','lime','indigo','ivory','cream','charcoal','burgundy',
  'rojo','azul','verde','amarillo','naranja','negro','blanco','gris','rosa','violeta',
  'marrón','marron','dorado','plateado','celeste','bordo','bordó','crema','turquesa',
  'fucsia','lila','beige','arena','natural','humo','acero','carbón','carbon',
  'fluo','fluor','fluorescente','mate','brillante','transparente','oscuro','oscura',
  'espejado','espejada','clear','dark','light','neon','matte','glossy',
]);

// Color translation map for display
const COLOR_TRANSLATE: Record<string, string> = {
  'red': 'Rojo', 'blue': 'Azul', 'green': 'Verde', 'yellow': 'Amarillo',
  'orange': 'Naranja', 'black': 'Negro', 'white': 'Blanco', 'grey': 'Gris',
  'gray': 'Gris', 'pink': 'Rosa', 'purple': 'Violeta', 'brown': 'Marrón',
  'silver': 'Plateado', 'gold': 'Dorado', 'navy': 'Azul Marino',
  'cyan': 'Celeste', 'magenta': 'Magenta', 'turquoise': 'Turquesa',
  'violet': 'Violeta', 'coral': 'Coral', 'maroon': 'Bordó',
  'olive': 'Oliva', 'teal': 'Verde Azulado', 'lime': 'Lima',
  'ivory': 'Marfil', 'cream': 'Crema', 'charcoal': 'Carbón',
  'burgundy': 'Bordó', 'dark': 'Oscuro', 'light': 'Claro',
  'clear': 'Transparente', 'neon': 'Neón', 'matte': 'Mate', 'glossy': 'Brillante',
};

const capitalizeColor = (color: string): string => {
  const lower = color.toLowerCase().trim();
  if (COLOR_TRANSLATE[lower]) return COLOR_TRANSLATE[lower];
  return color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
};

// Known motorcycle brands for auto-detection in product names
const MOTO_BRANDS = [
  'honda', 'yamaha', 'suzuki', 'kawasaki', 'bajaj', 'tvs', 'royal enfield',
  'benelli', 'cfmoto', 'voge', 'kymco', 'sym', 'zanella', 'motomel',
  'corven', 'gilera', 'guerrero', 'mondial', 'jawa', 'beta', 'keller',
  'keeway', 'lifan', 'siambretta', 'appia', 'brava', 'cerro', 'daelim',
  'ktm', 'husqvarna', 'bmw', 'harley', 'ducati', 'triumph',
];

// Extract moto brand+model from product name
const extractMotoFromName = (name: string): { nameWithoutMoto: string; detectedMoto: string } => {
  const lower = name.toLowerCase().trim();
  for (const brand of MOTO_BRANDS) {
    const brandIdx = lower.indexOf(brand);
    if (brandIdx > 0) {
      const nameWithoutMoto = name.substring(0, brandIdx).trim().replace(/[\s\-_/]+$/, '');
      const detectedMoto = name.substring(brandIdx).trim();
      if (nameWithoutMoto.length > 2) {
        return { nameWithoutMoto, detectedMoto };
      }
    }
  }
  return { nameWithoutMoto: name.trim(), detectedMoto: '' };
};

// Detect and extract color from the end of a name
const extractColorFromEnd = (name: string): { baseName: string; detectedColor: string } => {
  const words = name.trim().split(/[\s\-_/]+/);
  const extracted: string[] = [];
  while (words.length > 1) {
    const lastWord = words[words.length - 1].toLowerCase();
    if (COLOR_WORDS.has(lastWord)) {
      extracted.unshift(words.pop()!);
    } else {
      break;
    }
  }
  if (extracted.length > 0) {
    const detectedColor = extracted.map(w => capitalizeColor(w)).join('/');
    return { baseName: words.join(' ').trim(), detectedColor };
  }
  return { baseName: name.trim(), detectedColor: '' };
};

// Full extraction: moto first (from full name), then color from what remains
const extractFromName = (name: string): { baseName: string; detectedColor: string; detectedMoto: string } => {
  const { nameWithoutMoto, detectedMoto } = extractMotoFromName(name);
  const { baseName, detectedColor } = extractColorFromEnd(nameWithoutMoto);
  return { baseName, detectedColor, detectedMoto };
};

// Create grouping key by stripping color and moto from name
const getGroupKey = (name: string, color: string, moto: string): string => {
  let normalized = name.toLowerCase().trim();

  // Strip moto part
  if (moto) {
    const motoLower = moto.toLowerCase().trim();
    const motoIdx = normalized.indexOf(motoLower);
    if (motoIdx > 0) {
      normalized = normalized.substring(0, motoIdx).trim().replace(/[\s\-_/]+$/, '');
    }
  }

  // Strip explicit color
  if (color) {
    const colorLower = color.toLowerCase().trim();
    const endPattern = new RegExp(`[\\s\\-_/]*${colorLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
    normalized = normalized.replace(endPattern, '').trim();
  }

  // Strip known color words from end
  const words = normalized.split(/[\s\-_/]+/);
  while (words.length > 1 && COLOR_WORDS.has(words[words.length - 1])) {
    words.pop();
  }

  return words.join(' ').trim();
};

// --- DB field definitions ---
const DB_FIELDS = [
  { key: 'barcode', label: 'SKU / Código', required: false },
  { key: 'name', label: 'Nombre del Producto', required: true },
  { key: 'price', label: 'Precio de Lista', required: true },
  { key: 'public_price', label: 'Precio Público', required: false },
  { key: 'category', label: 'Categoría', required: false },
  { key: 'color', label: 'Color', required: false },
  { key: 'size', label: 'Talle', required: false },
  { key: 'moto_fit', label: 'Moto que le va', required: false },
  { key: 'stock', label: 'Stock / Disponibilidad', required: false },
] as const;

type MappingKey = typeof DB_FIELDS[number]['key'];

// Variant type
interface VariantColor {
  color: string;
  sizes: Record<string, number>; // size → stock (when product has sizes)
  stock?: number; // direct stock (when no sizes)
  moto_fit?: string[]; // motorcycles this color variant fits
}

const UniversalImporter = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<MappingKey, number | null>>({
    barcode: null, name: null, price: null, public_price: null, category: null, color: null, size: null, moto_fit: null, stock: null,
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number; errors: number; skipped: number; grouped: number } | null>(null);
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

    // Auto-map
    const autoMap: Record<MappingKey, number | null> = {
      barcode: null, name: null, price: null, public_price: null, category: null, color: null, size: null, moto_fit: null, stock: null,
    };
    parsedHeaders.forEach((h, i) => {
      const hl = h.toLowerCase();
      if (/sku|c[oó]digo|barcode|cod|art[ií]culo/.test(hl) && autoMap.barcode === null) autoMap.barcode = i;
      else if (/nombre|descripci[oó]n|producto|title|name|detalle/.test(hl) && autoMap.name === null) autoMap.name = i;
      else if (/precio.*p[uú]b|p\.?v\.?p|venta|público|public/.test(hl) && autoMap.public_price === null) autoMap.public_price = i;
      else if (/precio|price|lista|costo|valor/.test(hl) && autoMap.price === null) autoMap.price = i;
      else if (/categ|rubro|familia|grupo|linea|l[ií]nea/.test(hl) && autoMap.category === null) autoMap.category = i;
      else if (/color|colour/.test(hl) && autoMap.color === null) autoMap.color = i;
      else if (/talle|size|medida|talla/.test(hl) && autoMap.size === null) autoMap.size = i;
      else if (/moto|modelo|aplica|fit|compatible/.test(hl) && autoMap.moto_fit === null) autoMap.moto_fit = i;
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

  // --- Parse all rows into flat items ---
  const parseAllRows = useCallback(() => {
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
      const sizeRaw = mappedCols['size'] != null ? String(row[mappedCols['size']] ?? '').trim() : '';
      const motoFitRaw = mappedCols['moto_fit'] != null ? String(row[mappedCols['moto_fit']] ?? '').trim() : '';

      const price = cleanPrice(priceRaw);
      const pubPrice = cleanPrice(pubPriceRaw);
      const { stock, available } = cleanStock(stockRaw);
      const barcode = barcodeRaw || '';
      const category = categoryRaw || inferredCategories[idx] || 'Sin categoría';
      
      let color = colorRaw && colorRaw.toLowerCase() !== 'n/a' ? colorRaw : '';
      const size = sizeRaw && sizeRaw.toLowerCase() !== 'n/a' ? sizeRaw : '';
      let motoFit = motoFitRaw && motoFitRaw.toLowerCase() !== 'n/a' ? motoFitRaw : '';

      // Auto-detect color and moto from name when not explicitly mapped
      let detectedBaseName = nameVal;
      const extracted = extractFromName(nameVal);
      
      if (!color && mappedCols['color'] == null && extracted.detectedColor) {
        color = extracted.detectedColor;
      }
      if (!motoFit && mappedCols['moto_fit'] == null && extracted.detectedMoto) {
        motoFit = extracted.detectedMoto;
      }
      if (extracted.detectedColor || extracted.detectedMoto) {
        detectedBaseName = extracted.baseName;
      }

      return {
        barcode, name: nameVal, detectedBaseName, price: price ?? 0, public_price: pubPrice ?? price ?? 0,
        category, color, size, stock, available, motoFit, _generated: !barcodeRaw,
      };
    }).filter(Boolean) as any[];
  }, [rows, headers, mapping]);

  // --- Group items by product name to build variants ---
  const groupedProducts = useMemo(() => {
    if (step !== 'map' && step !== 'preview') return [];
    const items = parseAllRows();
    const hasExplicitColorOrSize = mapping.color !== null || mapping.size !== null;

    // Always try to group — either by explicit color/size columns or by detected colors in names
    const groups = new Map<string, any[]>();
    items.forEach(item => {
      let key: string;
      if (hasExplicitColorOrSize) {
        key = getGroupKey(item.name, item.color);
      } else if (item.color) {
        // Color was detected from name
        key = item.detectedBaseName.toLowerCase().trim();
      } else {
        // No color at all — standalone product
        key = item.name.toLowerCase().trim();
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([_groupKey, groupItems]) => {
      const first = groupItems[0];
      const hasMultiple = groupItems.length > 1;
      const hasAnyColor = groupItems.some(i => i.color);

      // Use the clean base name when we have multiple items or detected colors
      const productTitle = hasMultiple
        ? first.detectedBaseName || getGroupKey(first.name, first.color) || first.name
        : first.name;

      // Check if any item in the group has sizes
      const hasAnySizes = groupItems.some(i => i.size);

      // Build variants: group by color, then aggregate sizes and moto_fit
      const colorMap = new Map<string, { sizes: Record<string, number>; stock: number; motoFit: Set<string> }>();
      let totalStock = 0;

      groupItems.forEach(item => {
        const color = item.color || 'Único';
        if (!colorMap.has(color)) colorMap.set(color, { sizes: {}, stock: 0, motoFit: new Set() });
        const entry = colorMap.get(color)!;
        
        if (item.size) {
          entry.sizes[item.size] = (entry.sizes[item.size] || 0) + item.stock;
        } else {
          entry.stock += item.stock;
        }
        totalStock += item.stock;
        
        // Parse moto_fit (comma or slash separated)
        if (item.motoFit) {
          item.motoFit.split(/[,;\/]+/).map((m: string) => m.trim()).filter(Boolean).forEach((m: string) => entry.motoFit.add(m));
        }
      });

      const variants: VariantColor[] = Array.from(colorMap.entries()).map(([color, data]) => {
        const variant: VariantColor = { color, sizes: data.sizes };
        if (!hasAnySizes) {
          variant.stock = data.stock;
        }
        if (data.motoFit.size > 0) {
          variant.moto_fit = Array.from(data.motoFit);
        }
        return variant;
      });

      // Only keep variants if there's actual color/size differentiation
      const isRealVariant = hasAnyColor || hasAnySizes;
      const cleanVariants = isRealVariant ? variants.filter(v => v.color !== 'Único' || Object.keys(v.sizes).length > 0 || (v.stock ?? 0) > 0) : [];

      // Collect all unique sizes
      const allSizes = [...new Set(groupItems.map((i: any) => i.size).filter(Boolean))];
      
      // Collect all moto_fit
      const allMotoFit = [...new Set(groupItems.flatMap((i: any) => 
        i.motoFit ? i.motoFit.split(/[,;\/]+/).map((m: string) => m.trim()).filter(Boolean) : []
      ))];

      return {
        ...first,
        name: productTitle,
        stock: totalStock,
        available: totalStock > 0,
        variants: cleanVariants.length > 0 ? (isRealVariant ? variants : []) : [],
        sizes: allSizes,
        motoFit: allMotoFit,
        _variantCount: groupItems.length,
      };
    });
  }, [step, parseAllRows, mapping.color, mapping.size]);

  // --- Preview data ---
  const previewData = groupedProducts;

  // --- Import to Supabase ---
  const handleImport = async () => {
    if (previewData.length === 0) { toast.error("No hay datos para importar"); return; }
    setImporting(true);
    let inserted = 0, errors = 0, skipped = 0, grouped = 0;

    const { data: existingProducts } = await supabase.from('products').select('title');
    const existingTitles = new Set(
      (existingProducts || []).map((p: any) => p.title?.toLowerCase().trim())
    );

    const batch: any[] = [];
    const seenInFile = new Set<string>();

    previewData.forEach((item) => {
      const normalizedName = item.name.toLowerCase().trim();

      if (existingTitles.has(normalizedName) || seenInFile.has(normalizedName)) {
        skipped++;
        return;
      }
      seenInFile.add(normalizedName);

      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const barcode = item.barcode || `RFM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const hasVariants = item.variants && item.variants.length > 0 &&
        !(item.variants.length === 1 && item.variants[0].color === 'Único' && Object.keys(item.variants[0].sizes).length <= 1 && Object.keys(item.variants[0].sizes)[0] === 'Único');

      if (hasVariants && item._variantCount > 1) grouped++;

      batch.push({
        title: item.name,
        slug: `${slug}-${barcode.slice(-5).toLowerCase()}`,
        barcode,
        price: item.public_price ?? item.price ?? 0,
        original_price: item.price ?? 0,
        category: item.category,
        brand: 'Importado',
        stock: item.stock,
        description: null,
        images: [],
        sizes: item.sizes || [],
        moto_fit: item.motoFit || [],
        variants: hasVariants ? item.variants : [],
      });
    });

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
    setImportResult({ inserted, errors, skipped, grouped });
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    const skipMsg = skipped > 0 ? ` (${skipped} duplicados omitidos)` : '';
    const groupMsg = grouped > 0 ? ` (${grouped} con variantes agrupadas)` : '';
    toast.success(`Importación finalizada: ${inserted} productos${skipMsg}${groupMsg}`);
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({ barcode: null, name: null, price: null, public_price: null, category: null, color: null, size: null, moto_fit: null, stock: null });
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

            {/* Variant hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 font-bold space-y-1">
              <p>💡 El sistema detecta colores automáticamente en los nombres de productos y los agrupa como variantes.</p>
              <p>📐 Si mapeás "Talle", cada color tendrá sus propios talles con stock independiente.</p>
              <p>🏍️ Si mapeás "Moto que le va", cada color tendrá las motos compatibles asociadas.</p>
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
                    Vista Previa ({Math.min(10, previewData.length)} de {previewData.length} productos)
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
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Producto</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Precio</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Categoría</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Variantes</th>
                      <th className="px-3 py-2.5 text-left font-black uppercase text-zinc-500">Stock Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((item: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-zinc-50">
                        <td className="px-3 py-2.5 font-bold text-zinc-800 max-w-[200px]">
                          <div className="truncate">{item.name}</div>
                          {item._variantCount > 1 && (
                            <span className="bg-purple-100 text-purple-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              {item._variantCount} filas agrupadas
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-black text-zinc-900">{formatPrice(item.public_price || item.price)}</td>
                        <td className="px-3 py-2.5">
                          <span className="bg-zinc-100 text-zinc-600 text-[9px] font-black uppercase px-2 py-1 rounded-full">{item.category}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          {item.variants && item.variants.length > 0 ? (
                            <div className="space-y-1">
                              {item.variants.slice(0, 3).map((v: VariantColor, vi: number) => (
                                <div key={vi} className="text-[10px]">
                                  <span className="font-black text-zinc-700">{v.color}</span>
                                  {Object.keys(v.sizes).length > 0 && Object.keys(v.sizes)[0] !== 'Único' && (
                                    <span className="text-zinc-500">: {Object.keys(v.sizes).join(', ')}</span>
                                  )}
                                  {v.moto_fit && v.moto_fit.length > 0 && (
                                    <span className="text-blue-500 ml-1">🏍️ {v.moto_fit.length}</span>
                                  )}
                                </div>
                              ))}
                              {item.variants.length > 3 && (
                                <span className="text-[9px] text-zinc-400">+{item.variants.length - 3} más</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
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
              {importResult.grouped > 0 && (
                <>, <span className="font-black text-purple-600">{importResult.grouped}</span> con variantes agrupadas</>
              )}
              {importResult.skipped > 0 && (
                <>, <span className="font-black text-yellow-600">{importResult.skipped}</span> duplicados omitidos</>
              )}
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
