import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const AjustesTab = () => {
  const queryClient = useQueryClient();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<string>('image');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) { setMediaUrl(data.home_media_url || ''); setMediaType(data.home_media_type || 'image'); }
      return data;
    }
  });

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = `banner/${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) { toast.error("Error al subir"); return; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    if (data?.publicUrl) {
      setMediaUrl(data.publicUrl);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      home_media_url: mediaUrl,
      home_media_type: mediaType,
      updated_at: new Date().toISOString()
    };
    
    const { error } = settings?.id 
      ? await supabase.from('site_settings').update(payload).eq('id', settings.id)
      : await supabase.from('site_settings').insert([payload]);

    setSaving(false);
    if (!error) {
      toast.success("¡Banner actualizado!");
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
    } else { toast.error("Error: " + error.message); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter mb-10 leading-none">Ajustes</h1>
      <div className="bg-white rounded-[2.5rem] border p-6 md:p-10 space-y-8 shadow-sm">
        <div>
          <h3 className="font-black uppercase tracking-tighter text-lg mb-2">Banner Home</h3>
          <p className="text-zinc-400 text-xs font-medium">Subí una foto o video para el fondo de la pantalla principal.</p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button type="button" onClick={() => setMediaType('image')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mediaType === 'image' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Imagen</button>
            <button type="button" onClick={() => setMediaType('video')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${mediaType === 'video' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>Video</button>
          </div>
          <input className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none font-bold text-sm" placeholder="URL del medio" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed rounded-2xl py-8 text-zinc-400 hover:text-orange-500 hover:border-orange-500 font-black uppercase text-xs tracking-widest transition-all"><Upload size={20} className="inline mr-2" /> Subir archivo</button>
          <input type="file" accept="image/*,video/mp4" className="hidden" ref={fileInputRef} onChange={handleUploadBanner} />
        </div>
        {mediaUrl && (
          <div className="rounded-2xl overflow-hidden border bg-zinc-100 aspect-video shadow-inner">
            {mediaType === 'video' ? <video src={mediaUrl} controls className="w-full h-full object-cover" /> : <img src={mediaUrl} className="w-full h-full object-cover" />}
          </div>
        )}
        <button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 hover:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">{saving ? "Guardando..." : "Guardar Cambios"}</button>
      </div>
    </div>
  );
};

export default AjustesTab;
