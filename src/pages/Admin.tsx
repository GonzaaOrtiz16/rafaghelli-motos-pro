import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X, Upload, Tag, Truck, Box, ChevronDown, Copy, ImageIcon, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAdding, setIsAdding] = useState(false);
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

  const handleDuplicate = (product: any) => {
    setFormData({
      title: `${product.title} (Copia)`,
      price: product.price.toString(),
      category: product.category || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock?.toString() || '10',
      original_price: product.original_price?.toString() || '',
      free_shipping: product.free_shipping || false,
      is_on_sale: product.original_price > product.price
    });
    setTempImages(product.images || []); 
    setIsAdding(true);
    toast.info("Datos copiados. Podés editar o cambiar las fotos.");
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

  // MANEJO DE IMÁGENES CORREGIDO
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop();
        // Usamos un ID único para evitar que la caché del navegador no muestre la imagen
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          newUrls.push(data.publicUrl);
        }
      } catch (error) {
        console.error("Error subiendo imagen:", error);
        toast.error("Error al subir una imagen");
      }
    }

    // Actualización de estado segura usando el previo
    setTempImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
    toast.success("Imagen cargada correctamente");
    
    // Resetear el input para permitir subir la misma foto si se borra
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (urlToRemove: string) => {
    setTempImages(prev => prev.filter(url => url !== urlToRemove));
    toast.info("Imagen removida");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto del repuesto");
    
    setLoading(true);
    const slug = formData.title.toLowerCase().trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/[^\w-]/g, '');

    const productData = {
      title: formData.title,
      price: parseFloat(formData.price),
      original_price: formData.is_on_sale ? parseFloat(formData.original_price) : null,
      category: formData.category,
      brand: formData.brand,
      description: formData.description,
      stock: parseInt(formData.stock),
      free_shipping: formData.free_shipping,
      slug: slug,
      images: tempImages, // Se guarda como array text[]
    };

    const { error } = await supabase.from('products').insert([productData]);
    
    setLoading(false);
    if (!error) {
      toast.success("¡Producto publicado!");
      setIsAdding(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } else {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const resetForm = () => {
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
          <span className="text-xl font-black tracking-tighter uppercase text-orange-600">Rafaghelli</span>
          <span className="text-xl font-black tracking-tighter uppercase text-black">Motos</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-bold transition-all">
          <LogOut size={16} /> Salir al sitio
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase italic">Inventario</h1>
            <p className="text-gray-500 text-sm font-medium">Panel de Control Rafaghelli</p>
          </div>
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-orange-500 text-white px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 font-black uppercase tracking-tighter">
            <Plus size={20} /> Nuevo Producto
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
                <tr>
                  <th className="px-8 py-6">Repuesto / Marca</th>
                  <th className="px-8 py-6">Estado / Envío</th>
                  <th className="px-8 py-6 text-right">Precio Actual</th>
                  <th className="px-8 py-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-20 text-gray-300 animate-pulse font-bold tracking-widest">SINCRONIZANDO...</td></tr>
                ) : products?.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-5 flex items-center gap-5">
                      <div className="relative">
                        <img src={p.images?.[0]} className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm bg-gray-100" alt="" />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm uppercase tracking-tight">{p.title}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{p.brand} • {p.category}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex gap-2">
                        {p.original_price > p.price && <span className="bg-orange-100 text-orange-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter italic">Oferta</span>}
                        {p.free_shipping && <span className="bg-green-100 text-green-600 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter">Envío Gratis</span>}
                        <span className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter">Stock: {p.stock}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-lg text-gray-900 italic">
                      ${p.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleDuplicate(p)} className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><Copy size={18}/></button>
                        <button onClick={() => handleDelete(p.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Publicar Repuesto</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-3 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Nombre del Producto</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-orange-500/20 transition-all font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Marca</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Categoría</label>
                  <select 
                    className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Transmisión">Transmisión</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Motor">Motor</option>
                    <option value="Cubiertas">Cubiertas</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-[32px] p-8 space-y-6 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Precio ($)</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 outline-none font-black text-xl text-orange-500" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Stock</label>
                    <input className="w-full bg-white/10 rounded-xl px-5 py-3 outline-none font-black text-xl text-white" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button type="button" onClick={() => setFormData({...formData, is_on_sale: !formData.is_on_sale})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${formData.is_on_sale ? 'bg-orange-500' : 'bg-white/5 text-zinc-500'}`}>Oferta</button>
                  <button type="button" onClick={() => setFormData({...formData, free_shipping: !formData.free_shipping})} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${formData.free_shipping ? 'bg-green-500' : 'bg-white/5 text-zinc-500'}`}>Envío Gratis</button>
                </div>

                {formData.is_on_sale && (
                  <input className="w-full bg-white text-black rounded-xl px-5 py-3 outline-none font-black" type="number" placeholder="Precio Anterior" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} />
                )}
              </div>

              {/* FOTOS CON PREVIEW CORREGIDO */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Fotos</label>
                <div className="grid grid-cols-4 gap-4">
                  {tempImages.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group shadow-lg">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadingImages}
                    className="aspect-square rounded-2xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center hover:border-orange-500 transition-all"
                  >
                    {uploadingImages ? <Loader2 className="animate-spin text-orange-500" /> : <Upload className="text-gray-300" />}
                  </button>
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </div>

              <button type="submit" disabled={loading || uploadingImages} className="w-full bg-orange-500 text-white py-6 rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-orange-500/30">
                {loading ? "Sincronizando..." : "Publicar Ahora"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
