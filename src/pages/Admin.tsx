import { useState, useEffect } from 'react';
import { LogOut, Package, Bike, LayoutGrid, Settings, ScanBarcode, ScanLine, FileUp, RefreshCw, ShoppingBag } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import RepuestosTab from '@/components/admin/RepuestosTab';
import MotosTab from '@/components/admin/MotosTab';
import CategoriasTab from '@/components/admin/CategoriasTab';
import AjustesTab from '@/components/admin/AjustesTab';
import StockControlTab from '@/components/admin/StockControlTab';
import UniversalImporter from '@/components/admin/UniversalImporter';
import ProductUpdater from '@/components/admin/ProductUpdater';
import OrdersTab from '@/components/admin/OrdersTab';
import { toast } from 'sonner';

type TabId = 'ordenes' | 'repuestos' | 'motos' | 'categorias' | 'stock' | 'importar' | 'actualizar' | 'ajustes';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<TabId>('ordenes');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isEncargado, isVendedor, loading } = useUserRole();

  // Protect: vendedor -> redirect to /ventas
  useEffect(() => {
    if (!loading && user && isVendedor) {
      toast.info("Acceso restringido. Redirigiendo a Ventas...");
      navigate('/ventas');
    }
  }, [loading, user, isVendedor, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'ordenes', label: 'Órdenes', icon: ShoppingBag },
    { id: 'repuestos', label: 'Repuestos', icon: Package },
    { id: 'motos', label: 'Motos', icon: Bike },
    { id: 'categorias', label: 'Categorías', icon: LayoutGrid },
    { id: 'stock', label: 'Stock', icon: ScanBarcode },
    { id: 'importar', label: 'Importar', icon: FileUp },
    { id: 'actualizar', label: 'Actualizar', icon: RefreshCw },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      <header className="border-b px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center bg-white sticky top-0 z-20 shadow-sm gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-black uppercase text-orange-600 italic">Rafaghelli Motos</span>
            <span className="text-xl font-black uppercase text-black italic">Admin</span>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => navigate('/ventas')} className="text-orange-500 hover:text-orange-600 flex items-center gap-1 text-xs font-bold transition-all">
              <ScanLine size={14} /> POS
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-black flex items-center gap-2 text-xs font-bold transition-all">
              <LogOut size={14} /> Salir
            </button>
          </div>
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

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate('/ventas')} className="text-orange-500 hover:text-orange-600 flex items-center gap-2 text-sm font-bold transition-all">
            <ScanLine size={16} /> POS
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-black flex items-center gap-2 text-sm font-bold transition-all">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'ordenes' && <OrdersTab />}
        {activeTab === 'repuestos' && <RepuestosTab />}
        {activeTab === 'motos' && <MotosTab />}
        {activeTab === 'categorias' && <CategoriasTab />}
        {activeTab === 'stock' && <StockControlTab />}
        {activeTab === 'importar' && <UniversalImporter />}
        {activeTab === 'actualizar' && <ProductUpdater />}
        {activeTab === 'ajustes' && <AjustesTab />}
      </main>
    </div>
  );
};

export default Admin;
