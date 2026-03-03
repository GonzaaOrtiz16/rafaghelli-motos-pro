import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackagePlus, LayoutDashboard, Settings, ShoppingBag, Trash2, PlusCircle } from "lucide-react";

const Admin = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', slug: '', price: '', category: '', brand: '', moto_fit: '', description: '', image_url: ''
  });

  // Traer productos actuales para el listado
  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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
      moto_fit: [formData.moto_fit], // Formato Array corregido
      description: formData.description,
      images: [formData.image_url], // Formato Array corregido
      stock: 10
    }]);

    setLoading(false);
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Repuesto cargado correctamente");
      setFormData({ title: '', slug: '', price: '', category: '', brand: '', moto_fit: '', description: '', image_url: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Lateral */}
      <div className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-10 text-orange-500">Rafaghelli Admin</h2>
        <nav className="space-y-4">
          <div className="flex items-center gap-3 text-orange-400 p-2 bg-slate-800 rounded"><LayoutDashboard size={20}/> Dashboard</div>
          <div className="flex items-center gap-3 text-gray-400 p-2 hover:bg-slate-800 rounded cursor-pointer"><ShoppingBag size={20}/> Productos</div>
          <div className="flex items-center gap-3 text-gray-400 p-2 hover:bg-slate-800 rounded cursor-pointer"><Settings size={20}/> Ajustes</div>
        </nav>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Gestión de Inventario</h1>
          <div className="text-sm text-gray-500 font-mono">WhatsApp: 5491165483728</div>
        </div>

        {/* Stats Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm uppercase font-bold">Total Productos</p>
            <p className="text-3xl font-bold">{products?.length || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm uppercase font-bold">Categorías</p>
            <p className="text-3xl font-bold">4</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Carga */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PlusCircle className="text-orange-500" /> Nuevo Repuesto
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full border p-2 rounded-lg" placeholder="Nombre (ej: Kit de Transmisión)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                <input className="w-full border p-2 rounded-lg" placeholder="Slug (ej: kit-transmision-honda)" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required />
                <div className="grid grid-cols-2 gap-2">
                  <input className="border p-2 rounded-lg" type="number" placeholder="Precio" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  <input className="border p-2 rounded-lg" placeholder="Marca" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <input className="w-full border p-2 rounded-lg" placeholder="Compatibilidad (Moto)" value={formData.moto_fit} onChange={e => setFormData({...formData, moto_fit: e.target.value})} />
                <input className="w-full border p-2 rounded-lg" placeholder="URL de Imagen" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                <textarea className="w-full border p-2 rounded-lg h-24 text-sm" placeholder="Descripción detallada..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all flex justify-center items-center gap-2">
                   {loading ? "Cargando..." : <><PackagePlus size={20}/> Guardar Producto</>}
                </button>
              </form>
            </div>
          </div>

          {/* Listado de Productos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">Producto</th>
                    <th className="p-4 font-bold text-gray-600">Precio</th>
                    <th className="p-4 font-bold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products?.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.images?.[0]} className="w-10 h-10 object-cover rounded" alt="" />
                        <div>
                          <p className="font-bold text-sm">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.brand}</p>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">${p.price}</td>
                      <td className="p-4">
                        <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
