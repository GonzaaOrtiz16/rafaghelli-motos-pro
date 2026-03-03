import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X, Upload, Image as ImageIcon } from "lucide-react";
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

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Función para subir fotos al Storage
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
        toast.error(`Error subiendo foto: ${file.name}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setTempImages([...tempImages, ...uploadedUrls]);
    setUploadingImages(false);
    toast.success("Fotos cargadas correctamente");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    
    setLoading(true);
    const slug = formData.title.toLowerCase().trim().replace(/[\s_-]+/g, '-');

    const { error } = await supabase.from('products').insert([{
      ...formData,
      price: parseFloat(formData.price),
      slug,
      images: tempImages, // Guardamos el array de URLs
      moto_fit: [formData.moto_fit],
      stock: 10
    }]);

    setLoading(false);
    if (!error) {
      toast.success("¡Repuesto publicado!");
      setIsAdding(false);
      setTempImages([]);
      setFormData({ title: '', price: '', category: '', description: '', brand: '', moto_fit: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light tracking-widest uppercase">Rafaghelli Motos</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-xs font-medium uppercase">Admin</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm"><LogOut size={16} /> Salir</button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-normal text-gray-800">Inventario</h1>
          <button onClick={() => setIsAdding(true)} className="bg-black text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 text-sm shadow-sm">
            <Plus size={18} /> Nuevo producto
          </button>
        </div>

        {/* Tabla de productos (Igual que antes) */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
           {/* ... (Mismo código de la tabla del paso anterior) */}
        </div>
      </main>

      {/* MODAL DE CARGA PROFESIONAL */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="px-8 py-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Cargar Repuesto</h2>
              <button onClick={() => setIsAdding(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* ZONA DE CARGA DE FOTOS */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-400">Fotos del Producto (Varias)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-black cursor-pointer transition-colors bg-gray-50/50"
                >
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Upload className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">{uploadingImages ? "Subiendo..." : "Toca para elegir fotos del celular"}</p>
                </div>
                
                {/* Previsualización de fotos subidas */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {tempImages.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setTempImages(tempImages.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <input className="w-full border-b py-2 outline-none text-sm" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-6">
                <input className="border-b py-2 outline-none text-sm" type="number" placeholder="Precio ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <input className="border-b py-2 outline-none text-sm" placeholder="Categoría" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>

              <textarea className="w-full border rounded-xl p-3 text-sm h-24 bg-gray-50/30" placeholder="Descripción..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

              <button 
                type="submit" 
                disabled={loading || uploadingImages}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 disabled:bg-gray-200 shadow-lg"
              >
                {loading ? "Publicando..." : "Confirmar y Subir al Inventario"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
