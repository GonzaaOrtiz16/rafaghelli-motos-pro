import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para el formulario de nuevo producto
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: '',
    image_url: '',
    description: '',
    brand: '',
    moto_fit: ''
  });

  // Fetch de productos
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

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de eliminar este repuesto?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) toast.error("Error al eliminar");
      else {
        toast.success("Producto eliminado");
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Generar slug básico a partir del título
    const slug = formData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

    const { error } = await supabase.from('products').insert([{
      title: formData.title,
      slug: slug,
      price: parseFloat(formData.price),
      category: formData.category,
      brand: formData.brand,
      description: formData.description,
      images: [formData.image_url], // Lo enviamos como array {}
      moto_fit: [formData.moto_fit], // Lo enviamos como array {}
      stock: 10
    }]);

    setLoading(false);

    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("¡Producto cargado con éxito!");
      setIsAdding(false);
      setFormData({ title: '', price: '', category: '', image_url: '', description: '', brand: '', moto_fit: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header superior limpio */}
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light tracking-widest uppercase text-gray-900">Rafaghelli Motos</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-xs font-medium uppercase tracking-tighter">Admin Panel</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-sm"
        >
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-normal text-gray-800 tracking-tight">Productos</h1>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all font-medium text-sm shadow-sm"
          >
            <Plus size={18} /> Nuevo producto
          </button>
        </div>

        {/* Tabla Minimalista */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                <th className="px-6 py-5">Producto</th>
                <th className="px-6 py-5">Categoría</th>
                <th className="px-6 py-5 text-right">Precio</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-20 text-gray-400 animate-pulse">Cargando inventario...</td></tr>
              ) : products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                      <img 
                        src={p.images?.[0] || 'https://via.placeholder.com/100'} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt="" 
                      />
                    </div>
                    <span className="font-medium text-gray-900">{p.title}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{p.category || '—'}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ${Number(p.price).toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button className="p-2.5 text-gray-300 hover:text-black hover:bg-gray-100 rounded-full transition-all">
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL DE CARGA (Estilo Aura Femenina) */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-semibold text-gray-900">Añadir Producto</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-black transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre del Repuesto</label>
                <input 
                  className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition-colors text-sm" 
                  placeholder="Ej: Kit Transmisión Honda Tornado" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Precio ($)</label>
                  <input 
                    className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition-colors text-sm" 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Categoría</label>
                  <input 
                    className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition-colors text-sm" 
                    placeholder="Ej: Transmisión" 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">URL de la Imagen (Link directo)</label>
                <input 
                  className="w-full border-b border-gray-200 py-2 focus:border-black outline-none transition-colors text-sm" 
                  placeholder="https://..." 
                  value={formData.image_url} 
                  onChange={e => setFormData({...formData, image_url: e.target.value})} 
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Descripción</label>
                <textarea 
                  className="w-full border border-gray-100 rounded-xl p-3 focus:border-black outline-none transition-colors text-sm h-24 bg-gray-50/30" 
                  placeholder="Detalles técnicos del producto..." 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:bg-gray-200"
              >
                {loading ? "Publicando..." : "Confirmar y Subir"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
