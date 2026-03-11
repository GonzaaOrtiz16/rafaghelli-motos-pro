import React, { useState, useRef, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Upload, Copy, Loader2, Search } from "lucide-react";

const MotosTab = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', brand: '', model: '', year: new Date().getFullYear().toString(),
    kilometers: '0', price: '', condition: 'Nueva' as string, description: ''
  });
  const [tempImages, setTempImages] = useState<string[]>([]);

  const { data: motos } = useQuery({
    queryKey: ['admin-motorcycles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('motorcycles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filteredMotos = useMemo(() => {
    if (!motos) return [];
    return motos.filter(m => 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [motos, searchTerm]);

  const handleEdit = (moto: any) => {
    setEditingId(moto.id);
    setFormData({
      title: moto.title, brand: moto.brand, model: moto.model,
      year: moto.year.toString(), kilometers: moto.kilometers.toString(),
      price: moto.price.toString(), condition: moto.condition, description: moto.description || ''
    });
    setTempImages(moto.images || []);
    setIsAdding(true);
  };

  const handleDuplicate = (moto: any) => {
    setEditingId(null);
    setFormData({
      title: `${moto.title} (Copia)`, brand: moto.brand, model: moto.model,
      year: moto.year.toString(), kilometers: moto.kilometers.toString(),
      price: moto.price.toString(), condition: moto.condition, description: moto.description || ''
    });
    setTempImages(moto.images || []);
    setIsAdding(true);
    toast.info("Copiado. Editá lo que necesites.");
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar esta moto?")) {
      const { error } = await supabase.from('motorcycles').delete().eq('id', id);
      if (!error) { toast.success("Moto eliminada"); queryClient.invalidateQueries({ queryKey: ['admin-motorcycles'] }); }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fileName = `motos/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('product-images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        if (data?.publicUrl) newUrls.push(data.publicUrl);
      } catch { toast.error("Error al subir"); }
    }
    setTempImages(prev => [...prev, ...newUrls]);
    setUploadingImages(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempImages.length === 0) return toast.error("Subí al menos una foto");
    setLoading(true);
    const motoData = {
      title: formData.title, brand: formData.brand, model: formData.model,
      year: parseInt(formData.year), kilometers: parseInt(formData.kilometers),
      price: parseFloat(formData.price), condition: formData.condition,
      description: formData.description, images: tempImages,
    };
    let error;
    if (editingId) {
      const { error: e } = await supabase.from('motorcycles').update(motoData).eq('id', editingId);
      error = e;
    } else {
      const { error: e } = await supabase.from('motorcycles').insert([motoData]);
      error = e;
    }
    setLoading(false);
    if (!error) {
      toast.success(editingId ? "¡Moto actualizada!" : "¡Moto publicada!");
      setIsAdding(false); setEditingId(null); resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-motorcycles'] });
    } else { toast.error("Error: " + error.message); }
  };

  const resetForm = () => {
    setEditingId(null); setTempImages([]);
    setFormData({ title: '', brand: '', model: '', year: new Date().getFullYear().toString(), kilometers: '0', price: '', condition: 'Nueva', description: '' });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter leading-none">Motos</h1>
          <div className="mt-4 relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar marca o modelo..." 
              className="w-full bg-white border rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => { resetForm(); setIsAdding(true); }} className="w-full md:w-auto bg-orange-500 text-white p-4 md:px-8 md:py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all font-black uppercase shadow-lg shadow-orange-500/20">
          <Plus size={20} /> Nueva Moto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredMotos?.map(m => (
          <div key={m.id} className="bg-white rounded-3xl border shadow-sm p-4">
            <div className="flex gap-4">
              <img src={m.images?.[0] || '/placeholder.svg'} className="w-24 h-24 rounded-2xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{m.brand}</p>
                <h3 className="font-black uppercase text-[11px] truncate leading-tight">{m.title}</h3>
                <p className="text-[10px] font-bold text-zinc-400 mt-1">{m.year} · {m.kilometers} km</p>
                <p className="font-black text-sm mt-2 text-zinc-900">${m.price.toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button onClick={() => handleEdit(m)} className="flex-1 bg-zinc-900 text-white py-2 rounded-xl text-[10px] font-black uppercase">Editar</button>
              <button onClick={() => handleDuplicate(m)} className="p-2 bg-zinc-100 rounded-xl text-zinc-500"><Copy size={14}/></button>
              <button onClick={() => handleDelete(m.id)} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white border rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
            <tr>
              <th className="px-8 py-6">Moto</th>
              <th className="px-8 py-6">Año / KM</th>
              <th className="px-8 py-6 text-right">Precio</th>
              <th className="px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMotos?.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4 flex items-center gap-4">
                  <img src={m.images?.[0] || '/placeholder.svg'} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <div className="font-black text-sm uppercase">{m.title}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{m.brand} {m.model}</div>
                  </div>
                </td>
                <td className="px-8 py-4 font-bold text-xs uppercase text-zinc-500">{m.year} · {m.kilometers.toLocaleString()} KM</td>
                <td className="px-8 py-4 text-right font-black text-lg">${m.price.toLocaleString('es-AR')}</td>
                <td className="px-8 py-4 text-center">
                   <div className="flex justify-center gap-1">
                    <button onClick={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-orange-500"><Pencil size={18}/></button>
                    <button onClick={() => handleDuplicate(m)} className="p-2 text-gray-400 hover:text-zinc-900"><Copy size={18}/></button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 md:px-10 md:py-6 border-b flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black uppercase italic">{editingId ? 'Editar Moto' : 'Nueva Moto'}</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Título (ej: Honda Tornado XR 250)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Marca (ej: Honda)" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required />
                <input className="bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Modelo (ej: Tornado)" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Año</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-3 outline-none font-bold" type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Kilómetros</label>
                  <input className="w-full bg-gray-50 rounded-2xl px-6 py-3 outline-none font-bold" type="number" value={formData.kilometers} onChange={e => setFormData({...formData, kilometers: e.target.value})} required />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Condición</label>
                  <select className="w-full bg-gray-50 rounded-2xl px-6 py-3 outline-none font-bold" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="Nueva">Nueva</option>
                    <option value="Usada">Usada</option>
                  </select>
                </div>
              </div>

              <textarea className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold min-h-[80px]" placeholder="Descripción de la moto..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              
              <div className="bg-zinc-900 rounded-[32px] p-6 md:p-8">
                <label className="text-[10px] text-zinc-500 font-black uppercase ml-2">Precio de Venta ($)</label>
                <input className="w-full bg-white/10 rounded-xl px-5 py-4 text-orange-500 font-black text-2xl outline-none mt-2" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {tempImages.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter(u => u !== url))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={10}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex items-center justify-center text-gray-300 hover:text-orange-500 hover:border-orange-500 transition-colors">
                  {uploadingImages ? <Loader2 className="animate-spin"/> : <Upload/>}
                </button>
              </div>
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 sticky bottom-0 transition-all">
                {loading ? "Guardando..." : editingId ? "Guardar Cambios" : "Publicar Moto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MotosTab;
