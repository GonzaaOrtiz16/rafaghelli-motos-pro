import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X, Upload, Copy, Loader2, Check } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Nuevo: para saber si editamos
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', 
    price: '', 
    category: '', 
    description: '', 
    brand: '', 
    stock: '10',
    original_price: '',
    free_shipping: false,
    is_on_sale: false
  });
  
  const [tempImages, setTempImages] = useState<string[]>([]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // FUNCIÓN PARA CARGAR DATOS EN EL FORMULARIO (EDITAR)
  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      title: product.title,
      price: product.price.toString(),
      category: product.category || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock?.toString() || '10',
      original_price: product.original_price?.toString() || '',
      free_shipping: product.free_shipping || false,
      is_on_sale: !!product.is_on_sale
    });
    setTempImages(product.images || []);
    setIsAdding(true);
  };

  const handleDuplicate = (product: any) => {
    setEditingId(null); // Es un nuevo producto
    setFormData({
      title: `${product.title} (Copia)`,
      price: product.price.toString(),
      category: product.category || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock?.toString() || '10',
      original_price: product.original_price?.toString() || '',
      free_shipping: product.free_shipping || false,
      is_on_sale: !!product.is_on_sale
    });
    setTempImages(product.images || []); 
    setIsAdding(true);
    toast.info("Copiado. Editá lo que necesites.");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este repuesto definitivamente?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        toast.success("Producto eliminado");
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (data?.publicUrl) newUrls.push(data.publicUrl);
      } catch (error) {
        toast.error("Error al subir imagen");
      }
    }
    setTempImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);

    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');

    const productData = {
      title: formData.title,
      price: parseFloat(formData.price),
      original_price: formData.is_on_sale ? parseFloat(formData.original_price) : null,
      category: formData.category,
      brand: formData.brand,
      description: formData.description,
      stock: parseInt(formData.stock),
      free_shipping: formData.free_shipping,
      is_on_sale: formData.is_on_sale,
      slug: slug,
      images: tempImages,
    };

    let error;
    if (editingId) {
      // ACTUALIZAR EXISTENTE
      const { error: updateError } = await supabase.from('products').update(productData).eq('id', editingId);
      error = updateError;
    } else {
      // INSERTAR NUEVO
      const { error: insertError } = await supabase.from('products').insert([productData]);
      error = insertError;
    }

    setLoading(false);
    if (!error) {
      toast.success(editingId ? "¡Producto actualizado!" : "¡Producto publicado!");
      setIsAdding(false);
      setEditingId(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } else {
      toast.error("Error: " + error.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTempImages([]);
    setFormData({ 
      title: '', price: '', category: '', description: '', brand: '', 
      stock: '10', original_price: '', free_shipping: false, is_on_sale: false 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black uppercase text-orange-600 italic">Rafaghelli</span>
          <span className="text-xl font-black uppercase text-black italic">Motos</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-bold transition-all">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-end mb-10">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Inventario</h1>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-orange-500 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all font-black uppercase shadow-lg shadow-orange-500/20">
            <Plus size={20} /> Nuevo Repuesto
          </button>
        </div>

        <div className="bg-white border rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
              <tr>
                <th className="px-8 py-6">Producto</th>
                <th className="px-8 py-6">Estado</th>
                <th className="px-8 py-6 text-right">Precio</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4 flex items-center gap-4">
                    <img src={p.images?.[0]} className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                    <div>
                      <div className="font-black text-sm uppercase">{p.title}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{p.brand}</div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex gap-2">
                      {p.is_on_sale && <span className="bg-orange-100 text-orange-600 text-[9px] px-2 py-1 rounded-md font-black italic uppercase">Oferta</span>}
                      {p.free_shipping && <span className="bg-green-100 text-green-600 text-[9px] px-2 py-1 rounded-md font-black uppercase">Envío Gratis</span>}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right font-black text-lg">${p.price.toLocaleString('es-AR')}</td>
                  <td className="px-8 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleEdit(p)} className="p-2 text-gray-400 hover:text-orange-500"><Pencil size={18}/></button>
                      <button onClick={() => handleDuplicate(p)} className="p-2 text-gray-400 hover:text-blue-500"><Copy size={18}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic">{editingId ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Nombre del producto" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                <select className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                  <option value="">Categoría...</option>
                  <option value="Transmisión">Transmisión</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Motor">Motor</option>
                  <option value="Cubiertas">Cubiertas</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>

              <div className="bg-zinc-900 rounded-[32px] p-8 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Precio Actual</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 text-orange-500 font-black text-xl outline-none" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Stock</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 text-white font-black text-xl outline-none" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({...formData, is_on_sale: !formData.is_on_sale})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${formData.is_on_sale ? 'bg-orange-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {formData.is_on_sale && <Check size={12} className="inline mr-1" />} Oferta
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, free_shipping: !formData.free_shipping})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${formData.free_shipping ? 'bg-green-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                    {formData.free_shipping && <Check size={12} className="inline mr-1" />} Envío Gratis
                  </button>
                </div>

                {formData.is_on_sale && (
                  <input className="w-full bg-white rounded-xl px-5 py-3 font-black text-black outline-none" placeholder="Precio Original (el más caro)" type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                )}
              </div>

              <div className="grid grid-cols-4 gap-4">
                {tempImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter(u => u !== url))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-500">
                  {uploadingImages ? <Loader2 className="animate-spin"/> : <Upload/>}
                </button>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

              <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20">
                {loading ? "Sincronizando..." : editingId ? "Guardar Cambios" : "Publicar Ahora"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
