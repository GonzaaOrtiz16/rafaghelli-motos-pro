import React, { useState } from 'react';
import { X, Instagram } from "lucide-react";

const Watermark = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/40 pl-2 pr-1 py-1 rounded-full shadow-sm">
      <div className="flex items-center gap-1.5 px-1">
        {/* Icono sutil de Instagram */}
        <div className="text-[#E1306C]">
          <Instagram size={13} strokeWidth={2} />
        </div>
        
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="text-[10px] font-medium text-zinc-400">Edit by</span>
          <a 
            href="https://instagram.com/gonzaaortiz16" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#00BAE2]"
          >
            @gonzaaortiz16
          </a>
        </div>
      </div>

      {/* Botón X simple para cerrar */}
      <button 
        onClick={() => setIsVisible(false)}
        className="ml-1 p-0.5 hover:bg-zinc-200/50 rounded-full text-zinc-300 transition-colors"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Watermark;
