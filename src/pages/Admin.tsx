import { useState } from 'react';
import { LogOut, Package, Bike, LayoutGrid, Settings, ScanBarcode } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import RepuestosTab from '@/components/admin/RepuestosTab';
import MotosTab from '@/components/admin/MotosTab';
import CategoriasTab from '@/components/admin/CategoriasTab';
import AjustesTab from '@/components/admin/AjustesTab';
import StockControlTab from '@/components/admin/StockControlTab';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'repuestos' | 'motos' | 'categorias' | 'stock' | 'ajustes'>('repuestos');
  const navigate = useNavigate();

  const tabs = [
    { id: 'repuestos' as const, label: 'Repuestos', icon: Package },
    { id: 'motos' as const, label: 'Motos', icon: Bike },
    { id: 'categorias' as const, label: 'Categorías', icon: LayoutGrid },
    { id: 'stock' as const, label: 'Stock', icon: ScanBarcode },
    { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="border-b px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center bg-white sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-black uppercase text-orange-600 italic">Rafaghelli</span>
            <span className="text-xl font-black uppercase text-black italic">Admin</span>
          </div>
          <button onClick={() => navigate('/')} className="md:hidden text-gray-400 hover:text-black flex items-center gap-2 text-xs font-bold transition-all">
            <LogOut size={14} /> Salir
          </button>
        </div>

        <div className="flex gap-1 bg-zinc-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex-1 md:flex-none justify-center ${activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <button onClick={() => navigate('/')} className="hidden md:flex text-gray-400 hover:text-black items-center gap-2 text-sm font-bold transition-all">
          <LogOut size={16} /> Salir
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'repuestos' && <RepuestosTab />}
        {activeTab === 'motos' && <MotosTab />}
        {activeTab === 'categorias' && <CategoriasTab />}
        {activeTab === 'stock' && <StockControlTab />}
        {activeTab === 'ajustes' && <AjustesTab />}
      </main>
    </div>
  );
};

export default Admin;
