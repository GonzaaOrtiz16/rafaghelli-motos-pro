import React, { useState, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Search, Tag, Truck, Palette, Bike, Star, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import ProductEditor from './ProductEditor';
import { loadVariantsForProducts } from '@/lib/productVariants';

const RepuestosTab = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editorProduct, setEditorProduct] = useState<any | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Filtros
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "stock" | "nostock" | "featured" | "sale" | "freeship">("");

  // Ordenamiento
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc" | "name-asc" | "name-desc">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const ids = (data || []).map((p: any) => p.id);
      const variantsMap = await loadVariantsForProducts(ids);
      return (data || []).map((p: any) => ({ ...p, variants: variantsMap.get(p.id) || [] }));
    }
  });

  // Normaliza: minúsculas, sin acentos, sin signos, espacios colapsados
  const normalize = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Distancia de Levenshtein acotada (para tolerar typos pequeños)
  const lev = (a: string, b: string, max = 2) => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
    for (let j = 1; j <= b.length; j++) {
      let prev = dp[0]; dp[0] = j; let best = dp[0];
      for (let i = 1; i <= a.length; i++) {
        const tmp = dp[i];
        dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
        prev = tmp; if (dp[i] < best) best = dp[i];
      }
      if (best > max) return max + 1;
    }
    return dp[a.length];
  };

  // Extraer categorías y marcas únicas de los productos para los selectores
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = [...new Set(products.map((p: any) => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const brands = useMemo(() => {
    if (!products) return [];
    const brs = [...new Set(products.map((p: any) => p.brand).filter(Boolean))];
    return brs.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    // --- BÚSQUEDA INTELIGENTE ---
    const q = normalize(searchTerm);
    if (q) {
      const tokens = q.split(' ').filter(Boolean);
      const scored = result.map((p: any) => {
        const title = normalize(p.title);
        const brand = normalize(p.brand);
        const category = normalize(p.category);
        const barcode = normalize(p.barcode);
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const colors = normalize(variants.map((v: any) => v.color).filter(Boolean).join(' '));
        const motofit = normalize((p.moto_fit || []).join(' '));
        const hay = `${title} ${brand} ${category} ${barcode} ${colors} ${motofit}`;
        const titleWords = title.split(' ');

        let score = 0;
        let allMatch = true;

        if (title.includes(q)) score += 200;
        if (title.startsWith(q)) score += 150;

        for (const t of tokens) {
          let tokenScore = 0;
          if (title.startsWith(t)) tokenScore = 100;
          else if (titleWords.some(w => w.startsWith(t))) tokenScore = 80;
          else if (title.includes(t)) tokenScore = 60;
          else if (brand.includes(t)) tokenScore = 50;
          else if (category.includes(t)) tokenScore = 40;
          else if (barcode.includes(t)) tokenScore = 90;
          else if (colors.includes(t) || motofit.includes(t)) tokenScore = 30;
          else if (hay.includes(t)) tokenScore = 20;
          else if (t.length >= 4) {
            const maxD = t.length >= 7 ? 2 : 1;
            const hit = titleWords.find(w => w.length >= 3 && lev(w, t, maxD) <= maxD);
            if (hit) tokenScore = 25;
          }

          if (tokenScore === 0) { allMatch = false; break; }
          score += tokenScore;
        }

        if (allMatch && (p.stock ?? 0) > 0) score += 1;
        return allMatch ? { p, score } : null;
      }).filter(Boolean) as { p: any; score: number }[];

      scored.sort((a, b) => b.score - a.score);
      result = scored.map(s => s.p);
    }

    // --- FILTROS ---
    if (filterCategory) {
      result = result.filter((p: any) => normalize(p.category) === normalize(filterCategory));
    }
    if (filterBrand) {
      result = result.filter((p: any) => normalize(p.brand) === normalize(filterBrand));
    }
    if (filterStatus) {
      result = result.filter((p: any) => {
        switch (filterStatus) {
          case "stock": return (p.stock ?? 0) > 0;
          case "nostock": return (p.stock ?? 0) === 0;
          case "featured": return !!(p as any).is_featured;
          case "sale": return p.is_on_sale;
          case "freeship": return p.free_shipping;
          default: return true;
        }
      });
    }

    // --- ORDENAMIENTO ---
    result.sort((a: any, b: any) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "price-asc": return (a.price ?? 0) - (b.price ?? 0);
        case "price-desc": return (b.price ?? 0) - (a.price ?? 0);
        case "stock-asc": return (a.stock ?? 0) - (b.stock ?? 0);
        case "stock-desc": return (b.stock ?? 0) - (a.stock ?? 0);
        case "name-asc": return normalize(a.title).localeCompare(normalize(b.title));
        case "name-desc": return normalize(b.title).localeCompare(normalize(a.title));
        default: return 0;
      }
    });

    return result;
  }, [products, searchTerm, filterCategory, filterBrand, filterStatus, sortBy]);

  const handleEdit = (product: any) => {
    setEditorProduct(product);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditorProduct(null);
    setShowEditor(true);
  };

  const handleDuplicate = (product: any) => {
    setEditorProduct({
      ...product,
      id: undefined,
      title: `${product.title} (Copia)`,
      barcode: '',
    });
    setShowEditor(true);
    toast.info("Copiado. Editá lo que necesites.");
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_featured: !current } as any).eq('id', id);
    if (!error) {
      toast.success(!current ? "Producto destacado" : "Producto sin destacar");
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar definitivamente?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) { toast.success("Eliminado"); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); }
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Repuestos</h1>
          <div className="mt-4 relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar: 'casco mac negro', 'arkad xl', código de barras..."
              className="w-full bg-white border rounded-2xl pl-12 pr-20 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-700 bg-zinc-100 px-2 py-1 rounded-md"
              >
                {filteredProducts.length} ✕
              </button>
            )}
          </div>
        </div>
        <button onClick={handleNew} className="w-full md:w-auto bg-yellow-400 text-white p-4 md:px-8 md:py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all font-black uppercase shadow-lg shadow-yellow-400/20">
          <Plus size={20} /> Nuevo Repuesto
        </button>
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredProducts?.map((p) => {
          const variants = Array.isArray(p.variants) ? p.variants as any[] : [];
          const colorCount = variants.filter((v: any) => v.color && v.color !== 'Único').length;
          const motoFitList = p.moto_fit || [];
          return (
            <div key={p.id} className="bg-white rounded-2xl border shadow-sm p-3 flex gap-3 relative overflow-hidden">
              <img src={p.images?.[0] || '/placeholder.svg'} className="w-20 h-20 rounded-xl object-cover shrink-0 bg-zinc-100" />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{p.brand || 'Genérico'}</p>
                  <h3 className="font-black uppercase text-[11px] leading-tight truncate">{p.title}</h3>
                  <p className="font-black text-sm text-zinc-800 mt-0.5">${p.price.toLocaleString('es-AR')}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {colorCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                        <Palette size={8} /> {colorCount}
                      </span>
                    )}
                    {motoFitList.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[8px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                        <Bike size={8} /> {motoFitList.length}
                      </span>
                    )}
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${(p.stock ?? 0) > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      Stock: {p.stock ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleFeatured(p.id, !!(p as any).is_featured); }} className={`p-2 rounded-xl ${(p as any).is_featured ? 'bg-yellow-100 text-yellow-500' : 'bg-zinc-100 text-zinc-400'}`}><Star size={14} fill={(p as any).is_featured ? 'currentColor' : 'none'}/></button>
                  <button onClick={() => handleEdit(p)} className="flex-1 bg-zinc-700 text-white py-2 rounded-xl text-[9px] font-black uppercase">Editar</button>
                  <button onClick={() => handleDuplicate(p)} className="p-2 bg-zinc-100 rounded-xl text-zinc-500"><Copy size={14}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 rounded-xl text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
            <tr>
              <th className="px-6 py-5">Producto</th>
              <th className="px-4 py-5">Variantes</th>
              <th className="px-4 py-5">Estado</th>
              <th className="px-4 py-5">Categoría</th>
              <th className="px-4 py-5 text-right">Precio Venta</th>
              <th className="px-4 py-5 text-center">Stock</th>
              <th className="px-4 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts?.map((p) => {
              const variants = Array.isArray(p.variants) ? p.variants as any[] : [];
              const colors = variants.filter((v: any) => v.color && v.color !== 'Único');
              const motoFitList = p.moto_fit || [];
              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => handleEdit(p)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || '/placeholder.svg'} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-black text-sm uppercase truncate max-w-[220px]">{p.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{p.brand}</div>
                        {p.barcode && <div className="text-[9px] text-zinc-300 font-mono mt-0.5">{p.barcode}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1 max-w-[220px]">
                      {colors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {colors.slice(0, 4).map((v: any, i: number) => (
                            <span key={i} className="text-[8px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap">
                              <Palette size={7} /> {v.color}
                              {Object.keys(v.sizes || {}).filter((s: string) => s !== 'Único').length > 0 && (
                                <span className="text-purple-400"> ({Object.keys(v.sizes).filter((s: string) => s !== 'Único').join(',')})</span>
                              )}
                            </span>
                          ))}
                          {colors.length > 4 && <span className="text-[8px] text-zinc-400 font-bold">+{colors.length - 4} más</span>}
                        </div>
                      ) : motoFitList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {motoFitList.slice(0, 3).map((m: string, i: number) => (
                            <span key={i} className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 whitespace-nowrap">
                              <Bike size={7} /> {m}
                            </span>
                          ))}
                          {motoFitList.length > 3 && <span className="text-[8px] text-zinc-400 font-bold">+{motoFitList.length - 3}</span>}
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-300 italic">Sin variantes</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      {(p as any).is_featured && <span className="flex items-center gap-1 bg-yellow-100 text-yellow-600 text-[8px] px-2 py-1 rounded-full font-black uppercase"><Star size={10} fill="currentColor" /> Destacado</span>}
                      {p.is_on_sale && <span className="flex items-center gap-1 bg-yellow-100 text-yellow-500 text-[8px] px-2 py-1 rounded-full font-black uppercase"><Tag size={10} fill="currentColor" /> Oferta</span>}
                      {p.free_shipping && <span className="flex items-center gap-1 bg-green-100 text-green-600 text-[8px] px-2 py-1 rounded-full font-black uppercase"><Truck size={10} fill="currentColor" /> Envío</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="bg-zinc-100 text-zinc-500 text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-tighter">{p.category}</span></td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-black text-lg text-yellow-500">${p.price.toLocaleString('es-AR')}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-sm font-black ${(p.stock ?? 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleToggleFeatured(p.id, !!(p as any).is_featured)} className={`p-2 ${(p as any).is_featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}><Star size={18} fill={(p as any).is_featured ? 'currentColor' : 'none'}/></button>
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-yellow-400"><Pencil size={18}/></button>
                      <button onClick={() => handleDuplicate(p)} className="p-2 text-gray-400 hover:text-zinc-800"><Copy size={18}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showEditor && (
        <ProductEditor
          product={editorProduct}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
};

export default RepuestosTab;
