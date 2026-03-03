import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// Agregamos el ícono Copy
import { Plus, Pencil, Trash2, LogOut, X, Upload, Tag, Truck, Box, ChevronDown, Copy } from "lucide-react";
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
    discount_price: '',
    has_free_shipping: false,
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

  // NUEVA FUNCIÓN: DUPLICAR
  const handleDuplicate = (product: any) => {
    setFormData({
      title: `${product.title} (Copia)`,
      price: product.price.toString(),
      category: product.category || '',
      description: product.description || '',
      brand: product.brand || '',
      stock: product.stock?.toString() || '10',
      discount_price: product.discount_price?.toString() || '',
      has_free_shipping: product.has_free_shipping || false,
      is_on_sale: product.is_on_sale || false
    });
    // Opcional: Podés elegir si querés que se copien las fotos o no. 
    // Por seguridad, las dejamos vacías para que elijas las nuevas.
    setTempImages([]); 
    setIsAdding(true);
    toast.info("Datos del producto copiados");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este repuesto?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        toast.success("Eliminado");
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }
  };

  // ... (handleFileUpload y handleSubmit se mantienen igual que la versión anterior)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
      if (uploadError) continue;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      uploadedUrls.push(publicUrl);
    }
    setTempImages([...tempImages, ...uploadedUrls]);
    setUploadingImages(false);
    toast.success("Imágenes listas");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);
    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');
    const { error } = await supabase.from('products').insert([{
      ...formData,
      price: parseFloat(formData.price),
      discount_price: formData.is_on_sale ? parseFloat(formData.discount_price) : null,
      stock: parseInt(formData.stock),
      slug,
      images: tempImages,
    }]);
    setLoading(false);
    if (!error) {
      toast.success("Producto publicado con éxito");
      setIsAdding(false);
      setTempImages([]);
      setFormData({ title: '', price: '', category: '', description: '', brand: '', stock: '10', discount_price: '', has_free_shipping: false, is_on_sale: false });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter uppercase">Rafaghelli Motos</span>
          <div className="h-4 w-[1px] bg-gray-300 mx-2" />
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Panel de Control</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-medium transition-all">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Inventario</h1>
            <p className="text-gray-500 text-sm mt-1">Gestioná el stock de @gos_motos</p>
          </div>
          <button onClick={() => {
            setFormData({ title: '', price: '', category: '', description: '', brand: '', stock: '10', discount_price: '', has_free_shipping: false, is_on_sale: false });
            setTempImages([]);
            setIsAdding(true);
          }} className="bg-black text-white px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl font-bold">
            <Plus size={20} /> Nuevo Repuesto
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">
              <tr>
                <th className="px-8 py-6">Producto / Marca</th>
                <th className="px-8 py-6">Estado</th>
                <th className="px-8 py-6 text-right">Precio Actual</th>
                <th className="px-8 py-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-20 text-gray-300 animate-pulse font-bold tracking-widest">CARGANDO...</td></tr>
              ) : products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-5 flex items-center gap-5">
                    <img src={p.images?.[0]} className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm" alt="" />
                    <div>
                      <div className="font-bold text-gray-900">{p.title}</div>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-tighter">{p.brand || 'Genérico'} • {p.category}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      {p.is_on_sale && <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-full font-black uppercase">Oferta</span>}
                      {p.has_free_shipping && <span className="bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-full font-black uppercase">Envío Gratis</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-lg text-gray-900">
                    ${(p.discount_price || p.price).toLocaleString('es-AR')}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-1">
                      {/* NUEVO BOTÓN DUPLICAR */}
                      <button 
                        onClick={() => handleDuplicate(p)}
                        className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                        title="Duplicar producto"
                      >
                        <Copy size={20}/>
                      </button>
                      
                      <button className="p-3 text-gray-300 hover:text-black hover:bg-gray-100 rounded-2xl transition-all"><Pencil size={20}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL (Se mantiene el diseño con el Select de Categoría) */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-8 duration-500">
            <div className="px-10 py-8 border-b flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-2xl font-black tracking-tight">Publicar en Rafaghelli</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Nombre del Repuesto</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-black/5 transition-all font-medium" placeholder="Ej: Kit de Cilindro Yamaha YBR 125" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Marca</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none font-medium" placeholder="Honda, Motul, etc." value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Categoría</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 outline-none font-medium appearance-none cursor-pointer focus:ring-2 ring-black/5 transition-all"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="" disabled>Seleccioná una...</option>
                      <option value="Transmisión">Transmisión</option>
                      <option value="Frenos">Frenos</option>
                      <option value="Motor">Motor</option>
                      <option value="Cubiertas y Cámaras">Cubiertas y Cámaras</option>
                      <option value="Aceites y Filtros">Aceites y Filtros</option>
                      <option value="Accesorios y Cascos">Accesorios y Cascos</option>
                      <option value="Electricidad">Electricidad</option>
                      <option value="Suspensión">Suspensión</option>
                      <option value="Otros">Otros / Varios</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ... El resto de los campos: Precios, Envíos y Fotos ... */}
              <div className="bg-gray-50 rounded-[32px] p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2"><Tag size={12}/> Precio Base ($)</label>
                    <input className="w-full bg-white rounded-xl px-5 py-3 outline-none font-bold text-lg shadow-sm" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2"><Box size={12}/> Stock Disponible</label>
                    <input className="w-full bg-white rounded-xl px-5 py-3 outline-none font-bold text-lg shadow-sm" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button type="button" onClick={() => setFormData({...formData, is_on_sale: !formData.is_on_sale})} className={`px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all ${formData.is_on_sale ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>¿Tiene Descuento?</button>
                  <button type="button" onClick={() => setFormData({...formData, has_free_shipping: !formData.has_free_shipping})} className={`px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all ${formData.has_free_shipping ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}><Truck size={14} className="inline mr-1"/> Envío Gratis</button>
                </div>
                {formData.is_on_sale && (
                  <div className="space-y-2 animate-in fade-in">
                    <label className="text-[10px] uppercase font-black text-orange-500 tracking-widest">Precio Oferta ($)</label>
                    <input className="w-full bg-white border-2 border-orange-200 rounded-xl px-5 py-3 outline-none font-black text-lg text-orange-600" type="number" value={formData.discount_price} onChange={e => setFormData({...formData, discount_price: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Fotos</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 rounded-[32px] p-10 text-center hover:border-black cursor-pointer bg-gray-50 group">
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Upload className="mx-auto mb-3 text-gray-300 group-hover:text-black" size={32} />
                  <p className="text-sm font-bold text-gray-400 group-hover:text-black">Subir fotos</p>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {tempImages.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-[20px] overflow-hidden border-2 border-white shadow-md animate-in zoom-in">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button type="button" onClick={() => setTempImages(tempImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-1.5"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || uploadingImages} className="w-full bg-black text-white py-6 rounded-[24px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl">
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
