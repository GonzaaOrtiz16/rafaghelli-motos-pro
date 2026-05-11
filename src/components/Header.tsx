import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, Wrench, Phone, User, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/rafaghelli-logo.png";

const Header = () => {
  const { itemCount, openCart } = useCart();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['categorias', 'repuestos', 'nav'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('tipo', 'repuestos')
        .order('nombre');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/productos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 shadow-lg border-b border-zinc-800">
      {/* Top promo bar (amarillo) */}
      <div className="bg-yellow-400 text-zinc-900 text-xs font-bold">
        <div className="container flex items-center justify-between py-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> (011) 15 7074-1745</span>
            <span className="hidden sm:inline">Lun a Sáb 9:00 - 19:00</span>
          </div>
          <Link to="/taller" className="flex items-center gap-1 hover:underline uppercase tracking-wide">
            <Wrench className="h-3 w-3" /> Turnos de Taller
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex items-center gap-4 py-4">
        <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img src={logo} alt="Rafaghelli Motos" className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-2xl md:text-3xl font-display italic font-black tracking-tight title-brand">
              RAFAGHELLI
            </span>
            <span className="font-script text-lg md:text-xl title-motos -mt-1 ml-1 -rotate-3">Motos</span>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-4">
          <div className="flex w-full bg-zinc-800 rounded-full border border-zinc-700 focus-within:border-yellow-400 transition-colors">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent text-white px-6 py-3 text-sm focus:outline-none placeholder:text-zinc-400"
            />
            <button type="submit" className="px-5 text-zinc-300 hover:text-red-500 transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right leading-tight">
                <p className="text-xs text-zinc-400">¡Hola!</p>
                <p className="text-xs font-bold text-white truncate max-w-[140px]">{user.email}</p>
              </div>
              <button onClick={signOut} className="p-2 text-zinc-300 hover:text-red-500 transition-colors" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="hidden sm:flex items-center gap-2 text-zinc-200 hover:text-red-500 transition-colors">
              <User className="h-6 w-6" />
              <div className="text-left leading-tight">
                <p className="text-xs font-bold">¡Hola! Iniciá sesión</p>
                <p className="text-[10px] text-zinc-400">O podés registrarte</p>
              </div>
            </Link>
          )}
          <button onClick={openCart} className="relative p-2 text-zinc-200 hover:text-red-500 transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-zinc-900 text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden lg:block border-t border-zinc-800 bg-zinc-900">
        <div className="container flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/productos?categoria=${encodeURIComponent(cat.nombre)}`}
              className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-red-500 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-all whitespace-nowrap"
            >
              {cat.nombre}
            </Link>
          ))}
          <Link to="/motos" className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-red-500 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-all whitespace-nowrap">
            Motos
          </Link>
          <Link to="/taller" className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-red-500 hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-all whitespace-nowrap">
            Taller
          </Link>
        </div>
      </nav>

      {/* Mobile search + menu */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="flex w-full bg-zinc-800 rounded-full border border-zinc-700">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="flex-1 bg-transparent text-white px-5 py-2.5 text-sm focus:outline-none placeholder:text-zinc-400"
          />
          <button type="submit" className="px-4 text-zinc-300">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="flex flex-col pb-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/productos?categoria=${encodeURIComponent(cat.nombre)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-yellow-400 transition-colors border-b border-zinc-800"
              >
                {cat.nombre}
              </Link>
            ))}
            <Link to="/motos" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-yellow-400 border-b border-zinc-800">
              Motos
            </Link>
            <Link to="/taller" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-yellow-400">
              Taller
            </Link>
            {!user && (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-zinc-800">
                Iniciar sesión / Registrarse
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
