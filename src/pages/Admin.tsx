import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  // Traer productos con la misma lógica que Aura Femenina
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header superior estilo Aura */}
      <header className="border-b px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-light tracking-widest uppercase">Rafaghelli Motos</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 text-sm">Admin</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors text-sm"
        >
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-normal text-gray-800">Productos</h1>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-6 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition-all font-medium text-sm"
          >
            <Plus size={18} /> Nuevo producto
          </button>
        </div>

        {/* Tabla Minimalista */}
        <div className="overflow-hidden border rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-sm uppercase tracking-wider text-gray-600">
                <th className="px-6 py-4 font-semibold">Producto</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold text-right">Precio</th>
                <th className="px-6 py-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10">Cargando inventario...</td></tr>
              ) : products?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden border">
                      <img 
                        src={p.images?.[0] || 'https://via.placeholder.com/100'} 
                        className="w-full h-full object-cover" 
                        alt="" 
                      />
                    </div>
                    <span className="font-medium text-gray-900">{p.title}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic">{p.category || 'Sin categoría'}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ${Number(p.price).toLocaleString('es-AR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition-colors"
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

      {/* Aquí podrías agregar el Modal de "Nuevo Producto" para que sea idéntico */}
    </div>
  );
};

export default Admin;
