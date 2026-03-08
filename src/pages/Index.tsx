import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/data/products";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Clock, Star } from "lucide-react";

const Home = () => {
  // TRAEMOS LOS PRODUCTOS REALES DE SUPABASE
  const { data: products, isLoading } = useQuery({
    queryKey: ['public-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Hero Section - Estilo Rafaghelli */}
      <section className="relative h-[80vh] flex items-center bg-black overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&fit=crop" 
            className="w-full h-full object-cover opacity-60" 
            alt="Motos" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full mb-6">
              Nueva Temporada 2026
            </span>
            <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-6">
              POWER <br /> <span className="text-orange-500">PARTS.</span>
            </h1>
            <p className="text-gray-300 text-lg font-medium mb-10 max-w-lg">
              Repuestos de alta gama y accesorios certificados para potenciar tu moto. Envíos a todo el país.
            </p>
            <div className="flex gap-4">
              <button className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl">
                Ver Catálogo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías Dinámicas */}
      <section className="max-w-7xl mx-auto py-24 px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Categorías</h2>
            <p className="text-gray-400 font-medium">Elegí lo que tu moto necesita</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="group relative aspect-square rounded-[40px] overflow-hidden bg-gray-100 border border-gray-100 transition-all hover:-translate-y-2">
              <img src={cat.image} className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" alt={cat.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-7">
                <span className="text-white font-black uppercase text-xs tracking-widest">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Grill de Productos (Desde Supabase) */}
      <section className="bg-zinc-50 py-24 px-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter">Destacados</h2>
              <p className="text-gray-400 font-medium mt-2">Productos listos para despacho inmediato</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(n => <div key={n} className="h-[450px] bg-gray-200 rounded-[48px] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {products?.map((product) => (
                <div key={product.id} className="group bg-white rounded-[48px] p-6 shadow-sm hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100">
                  <div className="relative aspect-square rounded-[36px] overflow-hidden mb-8 bg-gray-50">
                    <img 
                      src={product.images?.[0]} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={product.title} 
                    />
                    {product.is_on_sale && (
                      <span className="absolute top-6 left-6 bg-black text-white text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-2xl">SALE</span>
                    )}
                  </div>
                  
                  <div className="px-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{product.brand}</span>
                      <div className="h-1 w-1 bg-gray-300 rounded-full" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.category}</span>
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-900 line-clamp-2 h-14 leading-tight group-hover:text-orange-500 transition-colors">{product.title}</h3>
                    
                    <div className="flex items-center justify-between mt-8">
                      <div>
                        <span className="block text-3xl font-black tracking-tighter">${product.price.toLocaleString('es-AR')}</span>
                        {product.is_on_sale && product.original_price && product.original_price > product.price && (
                          <span className="text-sm text-gray-400 line-through font-medium">${product.original_price.toLocaleString('es-AR')}</span>
                        )}
                      </div>
                      <Link to={`/product/${product.slug}`} className="bg-zinc-100 text-black p-5 rounded-3xl hover:bg-black hover:text-white transition-all group/btn">
                        <ArrowRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-[32px] flex items-center justify-center mb-6 text-orange-500">
              <Truck size={36} strokeWidth={2.5} />
            </div>
            <h4 className="font-black uppercase text-xl tracking-tighter mb-3">Envíos Rápidos</h4>
            <p className="text-gray-500 font-medium leading-relaxed">Despachamos tu pedido en menos de 24hs a todo el país.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-[32px] flex items-center justify-center mb-6 text-black">
              <ShieldCheck size={36} strokeWidth={2.5} />
            </div>
            <h4 className="font-black uppercase text-xl tracking-tighter mb-3">Garantía Rafaghelli</h4>
            <p className="text-gray-500 font-medium leading-relaxed">Todos nuestros repuestos están certificados y garantizados.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-[32px] flex items-center justify-center mb-6 text-white">
              <Clock size={36} strokeWidth={2.5} />
            </div>
            <h4 className="font-black uppercase text-xl tracking-tighter mb-3">Soporte 24/7</h4>
            <p className="text-gray-500 font-medium leading-relaxed">¿Dudas con la compatibilidad? Escribinos por WhatsApp.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
