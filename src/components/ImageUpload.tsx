import { useState, useRef, useEffect } from "react";
import { X, ImagePlus, Loader2, ClipboardPaste } from "lucide-react";

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  uploading?: boolean;
}

const ImageUpload = ({ onImagesSelected, uploading = false }: ImageUploadProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            // Rename pasted files with timestamp
            const renamed = new File([file], `pasted-${Date.now()}-${i}.${file.type.split('/')[1]}`, { type: file.type });
            imageFiles.push(renamed);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
        onImagesSelected(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onImagesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    onImagesSelected(files);
  };

  const removeImage = (index: number) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((src, index) => (
          <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-sm group">
            <img src={src} className="w-full h-full object-cover" alt="Vista previa" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {/* Botón elegir fotos */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-zinc-300 hover:border-orange-500 hover:bg-orange-50 transition-all bg-white"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-zinc-400 mb-2" />
              <span className="text-xs font-black uppercase text-zinc-500 tracking-tighter">
                Elegir Fotos
              </span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase">
        <ClipboardPaste size={14} />
        <span>También podés pegar imágenes con Ctrl+V / Cmd+V</span>
      </div>
      
      {previews.length > 0 && (
        <p className="text-[10px] font-bold text-orange-600 uppercase italic">
          * Revisá las fotos antes de guardar el producto
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
