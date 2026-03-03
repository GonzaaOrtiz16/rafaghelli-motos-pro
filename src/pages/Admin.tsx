import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X, Upload } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', price: '', category: '', description: '', brand: '', moto_fit: ''
  });
  const [tempImages, setTempImages] = useState<string[]>([]);

  // Cargar productos de la base de datos
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Función para subir archivos al Storage de Supabase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Error al subir: ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setTempImages([...tempImages, ...uploadedUrls]);
    setUploadingImages(false);
    toast.success("Fotos cargadas");
  };

  // Guardar el producto final
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Por favor, subí al menos una foto");
    
    setLoading(true);
    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabase.from('products').insert([{
      ...formData,
      price: parseFloat(formData.price),
      slug,
      images: tempImages, // Array de URLs
      moto_fit: [formData.moto_fit], // Array de compatibilidad
      stock: 10
    }]);

    setLoading(false);
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("¡Repuesto publicado con éxito!");
      setIsAdding(false);
      setTempImages([]);
      setFormData({ title: '', price: '', category: '', description: '', brand: '', moto_fit: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este repuesto?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        toast.success("Eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Header Admin */}
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light tracking-widest uppercase">Rafaghelli Motos</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-tighter">Admin</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm transition-colors">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-normal">Inventario</h1>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all text-sm shadow-sm"
          >
            <Plus size={18} /> Nuevo producto
          </button>
        </div>

        {/* Tabla Minimalista */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="px-6 py-5">Producto</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5 text-right">Precio</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-20 text-gray-300 animate-pulse font-medium">Cargando datos de @gos_motos...</td></tr>
              ) : products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                      <img src={p.images?.[0]} className="w-full h-full object-cover" alt="" />
                    </div>
                    <span className="font-medium">{p.title}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm italic">{p.category || 'Sin categoría'}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ${Number(p.price).toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button className="p-2.5 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-all"><Pencil size={18}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DE CARGA - REORDENADO */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">Nuevo Repuesto</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-black"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* 1. Datos principales */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre del Producto</label>
                  <input className="w-full border-b py-2 focus:border-black outline-none text-sm transition-all" placeholder="Ej: Kit Transmisión Honda Tornado" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Precio ($)</label>
                    <input className="w-full border-b py-2 focus:border-black outline-none text-sm transition-all" type="number" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Categoría</label>
                    <input className="w-full border-b py-2 focus:border-black outline-none text-sm transition-all" placeholder="Ej: Cubiertas" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Descripción / Notas</label>
                  <textarea className="w-full border border-gray-100 rounded-xl p-3 text-sm h-24 bg-gray-50/30 outline-none focus:border-black transition-all" placeholder="Detalles técnicos..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* 2. Fotos al final */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Fotos (Varias)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-100 rounded-2xl p-6 text-center hover:border-black cursor-pointer transition-all bg-gray-50/50 group"
                >
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Upload className="mx-auto mb-2 text-gray-400 group-hover:text-black transition-colors" />
                  <p className="text-xs text-gray-500 font-medium">{uploadingImages ? "Subiendo..." : "Toca para cargar desde tu celular"}</p>
                </div>
                
                {/* Previsualización corregida */}
                {tempImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {tempImages.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm shadow-black/5 animate-in fade-in zoom-in">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button 
                          type="button"
                          onClick={() => setTempImages(tempImages.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1.5 backdrop-blur-sm transition-all shadow-lg"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={loading || uploadingImages}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 disabled:bg-gray-200 shadow-xl transition-all active:scale-[0.98]"
              >
                {loading ? "Publicando en la web..." : "Confirmar y Publicar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
