import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, Wrench, Phone, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { itemCount, openCart } = useCart();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['categorias', 'repuestos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('tipo', 'repuestos')
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/productos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 header-gradient shadow-lg">
      {/* Top bar */}
      <div className="border-b border-muted/10">
        <div className="container flex items-center justify-between py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> (011) 15 7074-1745</span>
            <span className="hidden sm:inline">Lun a Sáb 9:00 - 19:00</span>
          </div>
          <Link to="/taller" className="flex items-center gap-1 text-primary hover:underline font-medium">
            <Wrench className="h-3 w-3" /> Turnos de Taller
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="container flex items-center gap-4 py-3">
        <button className="lg:hidden text-header-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-header-foreground tracking-tight">
            <span className="text-primary">Rafaghelli</span> Motos
          </h1>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="flex w-full">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar repuestos, cascos, cubiertas..."
              className="flex-1 rounded-l-lg border-0 bg-card text-foreground px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" variant="cta" className="rounded-l-none rounded-r-lg px-4">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
              <button onClick={signOut} className="p-2 text-header-foreground hover:text-primary transition-colors" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="p-2 text-header-foreground hover:text-primary transition-colors" title="Iniciar sesión">
              <User className="h-6 w-6" />
            </Link>
          )}
          <button onClick={openCart} className="relative p-2 text-header-foreground hover:text-primary transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden lg:block border-t border-muted/10">
        <div className="container flex items-center gap-6 py-2">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/productos?categoria=${cat.id}`}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {cat.name}
            </Link>
          ))}
          <Link to="/taller" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            Taller
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-muted/10 bg-card">
          <form onSubmit={handleSearch} className="p-3">
            <div className="flex">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 rounded-l-lg border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" variant="cta" size="sm" className="rounded-l-none rounded-r-lg">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <div className="flex flex-col pb-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/productos?categoria=${cat.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link to="/taller" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors">
              Taller
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
