import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    title: '', slug: '', price: '', category: '', brand: '', moto_fit: '', description: '', image_url: ''
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('products').insert([{
      title: formData.title,
      slug: formData.slug.toLowerCase().replace(/ /g, '-'),
      price: parseFloat(formData.price),
      category: formData.category,
      brand: formData.brand,
      moto_fit: [formData.moto_fit], 
      description: formData.description,
      images: [formData.image_url],
      stock: 10
    }]);

    setLoading(false);
    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Producto añadido a Rafaghelli Motos");
      setIsModalOpen(false);
      setFormData({ title: '', slug: '', price: '', category: '', brand: '', moto_fit: '', description: '', image_url: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este producto?")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        toast.success("Producto eliminado");
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header Admin */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tighter uppercase">Rafaghelli Motos</span>
          <span className="bg-gray-100 text-[10px] px-2 py-0.5 rounded font-bold text-gray-500 uppercase">Admin Panel</span>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm transition-colors">
          <LogOut size={16} /> Salir al sitio
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Inventario</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-sm text-sm"
          >
            <Plus size={18} /> Nuevo producto
          </button>
        </div>

        {/* Tabla Estilo Aura */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-[11px] uppercase tracking-widest text-gray-400 font-bold">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <img src={p.images?.[0]} className="w-12 h-12 object-cover rounded-md border bg-gray-50" />
                    <span className="font-medium text-gray-800">{p.title}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{p.category}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">${p.price.toLocaleString('es-AR')}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={17}/></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={17}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal de Carga (Overlay) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Añadir Nuevo Producto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black"><X/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Nombre del producto" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input className="border rounded-lg p-2.5 text-sm" type="number" placeholder="Precio ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                <input className="border rounded-lg p-2.5 text-sm" placeholder="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
              </div>
              <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="URL de la Imagen" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} required />
              <textarea className="w-full border rounded-lg p-2.5 text-sm h-24" placeholder="Descripción detallada..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:bg-gray-300"
              >
                {loading ? "Guardando..." : "Confirmar y Publicar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
