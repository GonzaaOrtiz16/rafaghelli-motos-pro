import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X, Upload, Copy, Loader2, Check, Bike, Settings, Package, LayoutGrid, Image, ExternalLink } from "lucide-react";
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

// ===================== ADMIN PRINCIPAL =====================
const Admin = () => {
  const [activeTab, setActiveTab] = useState<'repuestos' | 'motos' | 'categorias' | 'ajustes'>('repuestos');
  const navigate = useNavigate();

  const tabs = [
    { id: 'repuestos' as const, label: 'Repuestos', icon: Package },
    { id: 'motos' as const, label: 'Motos', icon: Bike },
    { id: 'categorias' as const, label: 'Categorías', icon: LayoutGrid },
    { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="border-b px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center bg-white sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-black uppercase text-orange-600 italic">Rafaghelli</span>
            <span className="text-xl font-black uppercase text-black italic">Admin</span>
          </div>
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-black flex items-center gap-2 text-xs font-bold transition-all">
            <LogOut size={14} /> Salir
          </button>
        </div>

        <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none justify-center ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <button onClick={() => navigate('/')} className="hidden md:flex text-gray-400 hover:text-black items-center gap-2 text-sm font-bold transition-all">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'repuestos' && <RepuestosTab />}
        {activeTab === 'motos' && <MotosTab />}
        {activeTab === 'categorias' && <CategoriasTab />}
        {activeTab === 'ajustes' && <AjustesTab />}
      </main>
    </div>
  );
};

// ===================== HOOK: Categorías dinámicas =====================
const useCategorias = (tipo?: string) => {
  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      let query = supabase.from('categorias').select('*').order('nombre');
      if (tipo) query = query.eq('tipo', tipo);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
};

// ===================== CATEGORÍAS TAB =====================
const CategoriasTab = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', tipo: 'repuestos', image: '' });

  const { data: categorias } = useCategorias();

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({ nombre: cat.nombre, tipo: cat.tipo || 'repuestos', image: cat.image || '' });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar esta categoría?")) {
      const { error } = await supabase.from('categorias').delete().eq('id', id);
      if (!error) { toast.success("Categoría eliminada"); queryClient.invalidateQueries({ queryKey: ['categorias'] }); }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `categorias/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) { toast.error("Error al subir"); setUploading(false); return; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    if (data?.publicUrl) setFormData(prev => ({ ...prev, image: data.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return toast.error("Ingresá un nombre");
    setLoading(true);
    const slug = formData.nombre.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');
    const catData = { nombre: formData.nombre, slug, tipo: formData.tipo, image: formData.image };

    let error;
    if (editingId) {
      const { error: e } = await supabase.from('categorias').update(catData).eq('id', editingId);
      error = e;
    } else {
      const { error: e } = await supabase.from('categorias').insert([catData]);
      error = e;
    }
    setLoading(false);
    if (!error) {
      toast.success(editingId ? "¡Categoría actualizada!" : "¡Categoría creada!");
      setIsAdding(false); setEditingId(null);
      setFormData({ nombre: '', tipo: 'repuestos', image: '' });
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    } else { toast.error("Error: " + error.message); }
  };

  const repuestosCats = categorias?.filter(c => c.tipo === 'repuestos') || [];
  const motosCats = categorias?.filter(c => c.tipo === 'motos') || [];

  return (
    <>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Categorías</h1>
        <button onClick={() => { setEditingId(null); setFormData({ nombre: '', tipo: 'repuestos', image: '' }); setIsAdding(true); }} className="bg-orange-500 text-white p-4 md:px-8 md:py-4 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black uppercase shadow-lg shadow-orange-500/20">
          <Plus size={20} /> <span className="hidden md:inline">Nueva</span>
        </button>
      </div>

      <div className="mb-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-4">Repuestos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {repuestosCats.map(cat => (
            <div key={cat.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm group relative">
              <div className="aspect-[3/2] bg-zinc-100 overflow-hidden">
                {cat.image && cat.image.length > 0 ? (
                  <img src={cat.image} className="w-full h-full object-cover" alt={cat.nombre} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300"><Image size={40} /></div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="font-black uppercase text-sm tracking-tight truncate mr-2">{cat.nombre}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-500"><Pencil size={14}/></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motos Categories */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-4">Motos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {motosCats.map(cat => (
            <div key={cat.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm group relative">
              <div className="aspect-[3/2] bg-zinc-100 overflow-hidden">
                {cat.image && cat.image.length > 0 ? (
                  <img src={cat.image} className="w-full h-full object-cover" alt={cat.nombre} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300"><Image size={40} /></div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="font-black uppercase text-sm tracking-tight truncate mr-2">{cat.nombre}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-500"><Pencil size={14}/></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 md:px-10 md:py-6 border-b flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black uppercase italic">{editingId ? 'Editar' : 'Nueva'} Categoría</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Nombre de la categoría" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
              
              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 mb-2 block">Tipo</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({...formData, tipo: 'repuestos'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${formData.tipo === 'repuestos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    Repuestos
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, tipo: 'motos'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${formData.tipo === 'motos' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    Motos
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2 mb-2 block">Imagen de categoría</label>
                {formData.image && formData.image.length > 0 ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border">
                    <img src={formData.image} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5"><X size={12}/></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-zinc-400 hover:text-orange-500 hover:border-orange-500 transition-all">
                    {uploading ? <Loader2 className="animate-spin" size={24} /> : <><Upload size={24} /><span className="text-[10px] font-black uppercase mt-2">Subir foto</span></>}
                  </button>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20">
                {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Categoría"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ===================== REPUESTOS TAB (REDISEÑADO CON TARJETAS) =====================
const RepuestosTab = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '', price: '', category: '', description: '', brand: '', stock: '10',
    original_price: '', free_shipping: false, is_on_sale: false, sizes: ''
  });
  const [tempImages, setTempImages] = useState<string[]>([]);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: categorias = [] } = useCategorias('repuestos');

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      title: product.title, price: product.price.toString(), category: product.category || '',
      description: product.description || '', brand: product.brand || '', stock: product.stock?.toString() || '10',
      original_price: product.original_price?.toString() || '', free_shipping: product.free_shipping || false,
      is_on_sale: !!product.is_on_sale, sizes: (product.sizes || []).join(', ')
    });
    setTempImages(product.images || []);
    setIsAdding(true);
  };

  const handleDuplicate = (product: any) => {
    setEditingId(null);
    setFormData({
      title: `${product.title} (Copia)`, price: product.price.toString(), category: product.category || '',
      description: product.description || '', brand: product.brand || '', stock: product.stock?.toString() || '10',
      original_price: product.original_price?.toString() || '', free_shipping: product.free_shipping || false,
      is_on_sale: !!product.is_on_sale, sizes: (product.sizes || []).join(', ')
    });
    setTempImages(product.images || []);
    setIsAdding(true);
    toast.info("Copiado. Editá lo que necesites.");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar definitivamente?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) { toast.success("Eliminado"); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fileName = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (data?.publicUrl) newUrls.push(data.publicUrl);
      } catch { toast.error("Error al subir"); }
    }
    setTempImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);
    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');
    const productData = {
      title: formData.title, price: parseFloat(formData.price),
      original_price: formData.is_on_sale && formData.original_price ? parseFloat(formData.original_price) : null,
      category: formData.category, brand: formData.brand, description: formData.description,
      stock: parseInt(formData.stock), free_shipping: formData.free_shipping,
      is_on_sale: formData.is_on_sale, slug, images: tempImages,
      sizes: formData.sizes.trim() ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    let error;
    if (editingId) {
      const { error: e } = await supabase.from('products').update(productData).eq('id', editingId);
      error = e;
    } else {
      const { error: e } = await supabase.from('products').insert([productData]);
      error = e;
    }
    setLoading(false);
    if (!error) {
      toast.success(editingId ? "¡Actualizado!" : "¡Publicado!");
      setIsAdding(false); setEditingId(null); resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } else { toast.error("Error: " + error.message); }
  };

  const resetForm = () => {
    setEditingId(null); setTempImages([]);
    setFormData({ title: '', price: '', category: '', description: '', brand: '', stock: '10', original_price: '', free_shipping: false, is_on_sale: false, sizes: '' });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Repuestos</h1>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-orange-500 text-white p-4 md:px-8 md:py-4 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black uppercase shadow-lg shadow-orange-500/20">
          <Plus size={20} /> <span className="hidden md:inline">Nuevo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((p) => (
          <div key={p.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
            {/* Imagen y Badges */}
            <div className="relative aspect-video overflow-hidden">
              <img src={p.images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {p.is_on_sale && <span className="bg-orange-500 text-white text-[9px] px-3 py-1 rounded-full font-black italic uppercase shadow-lg">Oferta</span>}
                {p.free_shipping && <span className="bg-green-500 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase shadow-lg">Envío Gratis</span>}
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full font-black">
                Stock: {p.stock}
              </div>
            </div>

            {/* Info */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{p.brand || 'Genérico'}</p>
                  <h3 className="font-black uppercase text-base leading-tight mt-1">{p.title}</h3>
                </div>
                <p className="font-black text-xl text-zinc-900">${p.price.toLocaleString('es-AR')}</p>
              </div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-tighter mb-6">{p.category}</p>

              {/* Acciones */}
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-50">
                <button onClick={() => handleEdit(p)} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] hover:bg-orange-600 transition-colors">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDuplicate(p)} className="p-3 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-colors">
                  <Copy size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 md:px-10 md:py-6 border-b flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black uppercase italic">{editingId ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Nombre del producto" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                <select className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Categoría...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <textarea className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold min-h-[80px]" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              
              <div className="bg-zinc-900 rounded-[32px] p-6 md:p-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Precio Actual</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 text-orange-500 font-black text-xl outline-none" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Stock</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 text-white font-black text-xl outline-none" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <button type="button" onClick={() => setFormData({...formData, is_on_sale: !formData.is_on_sale})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${formData.is_on_sale ? 'bg-orange-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {formData.is_on_sale && <Check size={12} className="inline mr-1" />} Oferta
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, free_shipping: !formData.free_shipping})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${formData.free_shipping ? 'bg-green-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {formData.free_shipping && <Check size={12} className="inline mr-1" />} Envío Gratis
                  </button>
                </div>
                {formData.is_on_sale && (
                  <input className="w-full bg-white rounded-xl px-5 py-3 font-black text-black outline-none" placeholder="Precio Original (tachado)" type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {tempImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter(u => u !== url))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-500 transition-colors">
                  {uploadingImages ? <Loader2 className="animate-spin"/> : <Upload/>}
                </button>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 sticky bottom-0">
                {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Publicar Ahora"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ===================== MOTOS TAB =====================
const MotosTab = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '', brand: '', model: '', year: new Date().getFullYear().toString(),
    kilometers: '0', price: '', condition: 'Nueva' as string, description: ''
  });
  const [tempImages, setTempImages] = useState<string[]>([]);

  const { data: motos } = useQuery({
    queryKey: ['admin-motorcycles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('motorcycles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleEdit = (moto: any) => {
    setEditingId(moto.id);
    setFormData({
      title: moto.title, brand: moto.brand, model: moto.model,
      year: moto.year.toString(), kilometers: moto.kilometers.toString(),
      price: moto.price.toString(), condition: moto.condition, description: moto.description || ''
    });
    setTempImages(moto.images || []);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar esta moto?")) {
      const { error } = await supabase.from('motorcycles').delete().eq('id', id);
      if (!error) { toast.success("Moto eliminada"); queryClient.invalidateQueries({ queryKey: ['admin-motorcycles'] }); }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    for (const file of Array.from(files)) {
      try {
        const fileName = `motos/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (data?.publicUrl) setTempImages(prev => [...prev, data.publicUrl]);
      } catch { toast.error("Error al subir"); }
    }
    setUploadingImages(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);
    const motoData = {
      title: formData.title, brand: formData.brand, model: formData.model,
      year: parseInt(formData.year), kilometers: parseInt(formData.kilometers),
      price: parseFloat(formData.price), condition: formData.condition,
      description: formData.description, images: tempImages,
    };
    let error;
    if (editingId) {
      const { error: e } = await supabase.from('motorcycles').update(motoData).eq('id', editingId);
      error = e;
    } else {
      const { error: e } = await supabase.from('motorcycles').insert([motoData]);
      error = e;
    }
    setLoading(false);
    if (!error) {
      toast.success(editingId ? "¡Moto actualizada!" : "¡Moto publicada!");
      setIsAdding(false); setEditingId(null); resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-motorcycles'] });
    } else { toast.error("Error: " + error.message); }
  };

  const resetForm = () => {
    setEditingId(null); setTempImages([]);
    setFormData({ title: '', brand: '', model: '', year: new Date().getFullYear().toString(), kilometers: '0', price: '', condition: 'Nueva', description: '' });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Motos</h1>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-orange-500 text-white p-4 md:px-8 md:py-4 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black uppercase shadow-lg shadow-orange-500/20">
          <Plus size={20} /> <span className="hidden md:inline">Nueva Moto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {motos?.map(m => (
          <div key={m.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm group hover:shadow-xl transition-all">
            <div className="aspect-video bg-zinc-100 overflow-hidden">
              <img src={m.images?.[0] || '/placeholder.svg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="p-6 space-y-3">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{m.brand}</p>
              <h3 className="font-black uppercase text-base">{m.title}</h3>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 font-black uppercase">
                <span className="bg-zinc-100 px-2 py-1 rounded">{m.year}</span>
                <span className="bg-zinc-100 px-2 py-1 rounded">{m.kilometers === 0 ? '0KM' : `${m.kilometers.toLocaleString()} km`}</span>
                <span className={`px-2 py-1 rounded ${m.condition === 'Nueva' ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{m.condition}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xl font-black">${m.price.toLocaleString('es-AR')}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-orange-500"><Pencil size={18}/></button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 md:px-10 md:py-6 border-b flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black uppercase italic">{editingId ? 'Editar Moto' : 'Nueva Moto'}</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Título (ej: Honda Wave 110)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required />
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Modelo" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Año</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Kilómetros</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" type="number" value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Condición</label>
                  <select className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="Nueva">Nueva (0KM)</option>
                    <option value="Usada">Usada</option>
                  </select>
                </div>
              </div>
              <div className="bg-zinc-900 rounded-[32px] p-6 md:p-8">
                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Precio</label>
                <input className="w-full bg-white/10 rounded-xl px-5 py-3 text-orange-500 font-black text-2xl outline-none" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>
              <textarea className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold min-h-[80px]" placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {tempImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter(u => u !== url))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-500 transition-colors">
                  {uploadingImages ? <Loader2 className="animate-spin"/> : <Upload/>}
                </button>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20">
                {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Publicar Moto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// ===================== AJUSTES TAB =====================
const AjustesTab = () => {
  const queryClient = useQueryClient();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<string>('image');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
      if (error) throw error;
      if (data) { setMediaUrl(data.home_media_url || ''); setMediaType(data.home_media_type || 'image'); }
      return data;
    }
  });

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = `banner/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) { toast.error("Error al subir"); return; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    if (data?.publicUrl) {
      setMediaUrl(data.publicUrl);
      const isVideo = file.type.startsWith('video');
      setMediaType(isVideo ? 'video' : 'image');
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    setSaving(true);
    const { error } = await supabase.from('site_settings').update({
      home_media_url: mediaUrl,
      home_media_type: mediaType,
      updated_at: new Date().toISOString()
    }).eq('id', settings.id);
    setSaving(false);
    if (!error) {
      toast.success("¡Banner actualizado!");
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    } else { toast.error("Error: " + error.message); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-10 leading-none">Ajustes</h1>

      <div className="bg-white rounded-[2.5rem] border p-6 md:p-10 space-y-8 shadow-sm">
        <div>
          <h3 className="font-black uppercase tracking-tighter text-lg mb-2">Banner Home</h3>
          <p className="text-zinc-400 text-xs font-medium">Subí una foto o video para el fondo de la pantalla principal.</p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <button type="button" onClick={() => setMediaType('image')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mediaType === 'image' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
              Imagen
            </button>
            <button type="button" onClick={() => setMediaType('video')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mediaType === 'video' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
              Video
            </button>
          </div>

          <input
            className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold text-sm"
            placeholder="URL del medio (o subir archivo)"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
          />

          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed rounded-2xl py-8 text-zinc-400 hover:text-orange-500 hover:border-orange-500 font-black uppercase text-xs tracking-widest transition-all">
            <Upload size={20} className="inline mr-2" /> Subir archivo
          </button>
          <input type="file" accept="image/*,video/mp4" className="hidden" ref={fileInputRef} onChange={handleUploadBanner} />
        </div>

        {mediaUrl && (
          <div className="rounded-2xl overflow-hidden border bg-zinc-100 aspect-video shadow-inner">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} className="w-full h-full object-cover" alt="Preview" />
            )}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
};

export default Admin;

