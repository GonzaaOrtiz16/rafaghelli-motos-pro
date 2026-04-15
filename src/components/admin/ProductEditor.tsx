import React, { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Upload, Loader2, ClipboardPaste, Plus, Trash2, Palette, GripVertical } from "lucide-react";
import { useCategorias } from './useCategorias';

interface Variant {
  color: string;
  price?: number | null;
  stock?: number | null;
  sizes: Record<string, number>;
  moto_fit?: string[];
  image?: string | null;
}

interface ProductEditorProps {
  product?: any;
  onClose: () => void;
}

const ProductEditor: React.FC<ProductEditorProps> = ({ product, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categorias = [] } = useCategorias('repuestos');
  
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [tempImages, setTempImages] = useState<string[]>(product?.images || []);
  const [activeSection, setActiveSection] = useState<'info' | 'variants' | 'media'>('info');

  const [formData, setFormData] = useState({
    title: product?.title || '',
    price: product?.price?.toString() || '',
    category: product?.category || '',
    description: product?.description || '',
    brand: product?.brand || '',
    stock: product?.stock?.toString() || '10',
    free_shipping: product?.free_shipping || false,
    is_on_sale: !!product?.is_on_sale,
    original_price: product?.original_price?.toString() || '',
    sizes: (product?.sizes || []).join(', '),
    barcode: product?.barcode || '',
    moto_fit: (product?.moto_fit || []).join(', '),
  });

  // Parse existing variants
  const parseVariants = (): Variant[] => {
    if (!product?.variants) return [];
    const raw = Array.isArray(product.variants) ? product.variants : [];
    return raw.map((v: any) => ({
      color: v.color || '',
      price: v.price ?? null,
      stock: v.stock ?? null,
      sizes: v.sizes || {},
      moto_fit: v.moto_fit || [],
    }));
  };

  const [variants, setVariants] = useState<Variant[]>(parseVariants());
  const [newSizeInput, setNewSizeInput] = useState<Record<number, string>>({});

  // Paste images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(new File([file], `pasted-${Date.now()}-${i}.${file.type.split('/')[1]}`, { type: file.type }));
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        toast.info("Subiendo imagen pegada...");
        await uploadFiles(imageFiles);
        toast.success("Imagen subida");
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const uploadFiles = async (files: File[]) => {
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of files) {
      try {
        const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (data?.publicUrl) newUrls.push(data.publicUrl);
      } catch { toast.error("Error al subir imagen"); }
    }
    setTempImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { color: '', price: null, stock: null, sizes: {}, moto_fit: [] }]);
    setActiveSection('variants');
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const addSizeToVariant = (variantIndex: number) => {
    const sizeName = newSizeInput[variantIndex]?.trim();
    if (!sizeName) return;
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      return { ...v, sizes: { ...v.sizes, [sizeName]: 0 } };
    }));
    setNewSizeInput(prev => ({ ...prev, [variantIndex]: '' }));
  };

  const updateSizeStock = (variantIndex: number, size: string, qty: number) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      return { ...v, sizes: { ...v.sizes, [size]: qty } };
    }));
  };

  const removeSizeFromVariant = (variantIndex: number, size: string) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== variantIndex) return v;
      const { [size]: _, ...rest } = v.sizes;
      return { ...v, sizes: rest };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);

    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');
    
    // Calculate total stock from variants if they exist
    let totalStock = parseInt(formData.stock) || 0;
    if (variants.length > 0) {
      totalStock = variants.reduce((sum, v) => {
        const sizeStock = Object.values(v.sizes).reduce((s, q) => s + (Number(q) || 0), 0);
        return sum + (sizeStock > 0 ? sizeStock : (Number(v.stock) || 0));
      }, 0);
    }

    // Clean variants for storage
    const cleanVariants = variants.filter(v => v.color.trim()).map(v => ({
      color: v.color.trim(),
      price: v.price ? Number(v.price) : null,
      stock: Object.values(v.sizes).reduce((s, q) => s + (Number(q) || 0), 0) || (Number(v.stock) || 0),
      sizes: v.sizes,
      moto_fit: v.moto_fit || [],
    }));

    const motoFitArr = formData.moto_fit.trim() ? formData.moto_fit.split(',').map(s => s.trim()).filter(Boolean) : [];

    const productData: any = {
      title: formData.title,
      price: parseFloat(formData.price),
      original_price: formData.is_on_sale && formData.original_price ? parseFloat(formData.original_price) : null,
      category: formData.category,
      brand: formData.brand,
      description: formData.description,
      stock: totalStock,
      free_shipping: formData.free_shipping,
      is_on_sale: formData.is_on_sale,
      slug,
      images: tempImages,
      sizes: formData.sizes.trim() ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      barcode: formData.barcode.trim() || null,
      variants: cleanVariants,
      moto_fit: motoFitArr,
    };

    let error;
    if (product?.id) {
      const { error: e } = await supabase.from('products').update(productData).eq('id', product.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('products').insert([productData]);
      error = e;
    }
    setLoading(false);
    if (!error) {
      toast.success(product?.id ? "¡Actualizado!" : "¡Publicado!");
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      onClose();
    } else toast.error("Error: " + error.message);
  };

  const sections = [
    { id: 'info' as const, label: 'Información' },
    { id: 'variants' as const, label: `Variantes (${variants.length})` },
    { id: 'media' as const, label: `Fotos (${tempImages.length})` },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-4 md:px-8 md:py-5 border-b flex justify-between items-center shrink-0">
          <h2 className="text-lg md:text-xl font-black uppercase italic">{product?.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b px-5 md:px-8 shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${activeSection === s.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* INFO SECTION */}
          {activeSection === 'info' && (
            <div className="p-5 md:p-8 space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Nombre del producto</label>
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Marca</label>
                  <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Categoría</label>
                  <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Descripción</label>
                <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm min-h-[80px] focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Código de barras</label>
                  <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Motos compatibles</label>
                  <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" placeholder="CG Titan, XR 150..." value={formData.moto_fit} onChange={e => setFormData({...formData, moto_fit: e.target.value})} />
                </div>
              </div>

              {/* Pricing block */}
              <div className="bg-zinc-900 rounded-2xl p-5 space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Precio de Venta</label>
                    <input className="w-full bg-white/10 rounded-xl px-4 py-3 text-orange-500 font-black text-xl outline-none focus:ring-2 focus:ring-orange-500/30" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Stock General</label>
                    <input className="w-full bg-white/10 rounded-xl px-4 py-3 text-white font-black text-xl outline-none focus:ring-2 focus:ring-white/10" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    {variants.length > 0 && (
                      <p className="text-[9px] text-zinc-500 mt-1 ml-1">Se calcula automático desde variantes</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setFormData({...formData, is_on_sale: !formData.is_on_sale})}
                        className={`w-11 h-6 rounded-full relative transition-colors ${formData.is_on_sale ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_on_sale ? 'left-6' : 'left-1'}`} />
                      </button>
                      <span className="text-white text-[10px] font-black uppercase">Oferta</span>
                    </div>
                    {formData.is_on_sale && (
                      <input className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-400 font-bold text-sm outline-none w-32 focus:border-orange-500/50" placeholder="Precio anterior" type="number"
                        value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData({...formData, free_shipping: !formData.free_shipping})}
                      className={`w-11 h-6 rounded-full relative transition-colors ${formData.free_shipping ? 'bg-green-500' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.free_shipping ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className="text-white text-[10px] font-black uppercase">Envío Gratis</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-black uppercase ml-1 block mb-1">Talles generales (separados por coma)</label>
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none font-bold text-sm focus:ring-2 focus:ring-orange-500/20 transition-all" placeholder="S, M, L, XL" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} />
              </div>
            </div>
          )}

          {/* VARIANTS SECTION */}
          {activeSection === 'variants' && (
            <div className="p-5 md:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase">Variantes del producto</p>
                  <p className="text-[10px] text-zinc-400">Cada color/versión con su stock y talles independientes</p>
                </div>
                <button type="button" onClick={addVariant} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-orange-600 transition-colors">
                  <Plus size={14} /> Agregar
                </button>
              </div>

              {variants.length === 0 && (
                <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center">
                  <Palette className="mx-auto text-zinc-300 mb-2" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Sin variantes</p>
                  <p className="text-[10px] text-zinc-300 mt-1">Agregá colores, talles y stock individual</p>
                </div>
              )}

              {variants.map((variant, vi) => {
                const totalSizeStock = Object.values(variant.sizes).reduce((s, q) => s + (Number(q) || 0), 0);
                const hasSizes = Object.keys(variant.sizes).filter(s => s !== 'Único').length > 0;
                return (
                  <div key={vi} className="bg-zinc-50 border rounded-2xl overflow-hidden">
                    {/* Variant header */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-100/50">
                      <GripVertical size={14} className="text-zinc-300" />
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                          className="bg-white border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Color / Versión"
                          value={variant.color}
                          onChange={e => updateVariant(vi, 'color', e.target.value)}
                        />
                        <input
                          className="bg-white border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="Precio (opcional)"
                          type="number"
                          value={variant.price ?? ''}
                          onChange={e => updateVariant(vi, 'price', e.target.value ? Number(e.target.value) : null)}
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-zinc-400 uppercase whitespace-nowrap">Stock total:</span>
                          <span className={`text-sm font-black ${totalSizeStock > 0 || (variant.stock && variant.stock > 0) ? 'text-emerald-600' : 'text-red-500'}`}>
                            {hasSizes ? totalSizeStock : (variant.stock ?? 0)}
                          </span>
                        </div>
                        {!hasSizes && (
                          <input
                            className="bg-white border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                            placeholder="Stock"
                            type="number"
                            value={variant.stock ?? ''}
                            onChange={e => updateVariant(vi, 'stock', e.target.value ? Number(e.target.value) : null)}
                          />
                        )}
                      </div>
                      <button type="button" onClick={() => removeVariant(vi)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Sizes */}
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[9px] font-black text-zinc-400 uppercase">Talles / Medidas</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(variant.sizes).filter(([s]) => s !== 'Único').map(([size, qty]) => (
                          <div key={size} className="flex items-center bg-white border rounded-lg overflow-hidden">
                            <span className="px-2.5 py-1.5 text-[10px] font-black uppercase bg-zinc-50 border-r">{size}</span>
                            <input
                              className="w-14 px-2 py-1.5 text-sm font-bold text-center outline-none"
                              type="number"
                              value={qty as number}
                              onChange={e => updateSizeStock(vi, size, Number(e.target.value) || 0)}
                            />
                            <button type="button" onClick={() => removeSizeFromVariant(vi, size)} className="px-1.5 py-1.5 text-zinc-300 hover:text-red-500 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            className="bg-white border rounded-lg px-2.5 py-1.5 text-sm font-bold w-20 outline-none focus:ring-2 focus:ring-orange-500/20"
                            placeholder="Talle..."
                            value={newSizeInput[vi] || ''}
                            onChange={e => setNewSizeInput(prev => ({ ...prev, [vi]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSizeToVariant(vi); } }}
                          />
                          <button type="button" onClick={() => addSizeToVariant(vi)} className="bg-zinc-900 text-white p-1.5 rounded-lg hover:bg-zinc-700 transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Variant-specific moto_fit */}
                      <div className="pt-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase block mb-1">Motos compatibles (variante)</label>
                        <input
                          className="w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                          placeholder="CG Titan, Wave 110..."
                          value={(variant.moto_fit || []).join(', ')}
                          onChange={e => updateVariant(vi, 'moto_fit', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MEDIA SECTION */}
          {activeSection === 'media' && (
            <div className="p-5 md:p-8 space-y-4">
              <p className="text-sm font-black uppercase">Imágenes del producto</p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {tempImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border group">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter(u => u !== url))} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                    {i === 0 && <span className="absolute bottom-1.5 left-1.5 bg-orange-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">Principal</span>}
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-500 transition-colors gap-1">
                  {uploadingImages ? <Loader2 className="animate-spin" size={20} /> : <><Upload size={20} /><span className="text-[8px] font-bold uppercase">Subir</span></>}
                </button>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) await uploadFiles(files);
              }} />
              <p className="flex items-center gap-2 text-[10px] font-bold text-zinc-400"><ClipboardPaste size={14} /> Pegá imágenes con Ctrl+V / Cmd+V</p>
            </div>
          )}

          {/* Submit */}
          <div className="p-5 md:p-8 pt-0 sticky bottom-0 bg-white border-t">
            <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-orange-500/20 transition-colors">
              {loading ? "Guardando..." : product?.id ? "Guardar Cambios" : "Publicar Ahora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditor;
