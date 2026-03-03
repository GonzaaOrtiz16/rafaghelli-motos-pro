import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Admin = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    price: '',
    category: '',
    brand: '',
    moto_fit: '', // Lo convertiremos a array antes de enviar
    description: '',
    image_url: ''
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
      moto_fit: [formData.moto_fit], // Formato Array para que Supabase lo acepte
      description: formData.description,
      images: [formData.image_url], // Formato Array
      stock: 10
    }]);

    setLoading(false);
    if (error) {
      toast.error("Error al subir: " + error.message);
    } else {
      toast.success("Producto cargado en Rafaghelli Motos!");
      setFormData({ title: '', slug: '', price: '', category: '', brand: '', moto_fit: '', description: '', image_url: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Carga - Rafaghelli</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 bg-white p-6 shadow rounded-xl">
        <input className="border p-2 rounded" placeholder="Título (ej: Cubierta Metzeler)" onChange={e => setFormData({...formData, title: e.target.value})} required />
        <input className="border p-2 rounded" placeholder="Slug (ej: cubierta-metzeler-110)" onChange={e => setFormData({...formData, slug: e.target.value})} required />
        <input className="border p-2 rounded" type="number" placeholder="Precio" onChange={e => setFormData({...formData, price: e.target.value})} required />
        <input className="border p-2 rounded" placeholder="Categoría" onChange={e => setFormData({...formData, category: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Marca del repuesto" onChange={e => setFormData({...formData, brand: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Moto compatible (ej: Honda CB250)" onChange={e => setFormData({...formData, moto_fit: e.target.value})} />
        <input className="border p-2 rounded" placeholder="URL de la imagen" onChange={e => setFormData({...formData, image_url: e.target.value})} />
        <textarea className="border p-2 rounded" placeholder="Descripción larga" onChange={e => setFormData({...formData, description: e.target.value})} />
        <button type="submit" disabled={loading} className="bg-orange-600 text-white py-3 rounded font-bold hover:bg-orange-700">
          {loading ? "Cargando..." : "SUBIR PRODUCTO"}
        </button>
      </form>
    </div>
  );
};

export default Admin;
