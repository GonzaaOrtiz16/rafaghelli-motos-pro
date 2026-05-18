import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Star, Truck } from "lucide-react";
import { useHomeData } from "@/hooks/useHomeData";
import MarqueeTicker from "@/components/home/MarqueeTicker";
import HeroBanners from "@/components/home/HeroBanners";
import TrustBadges from "@/components/home/TrustBadges";
import CategoriesSection from "@/components/home/CategoriesSection";
import NextBikeBanner from "@/components/home/NextBikeBanner";
import ProductCarousel from "@/components/home/ProductCarousel";
import HomeVideo from "@/components/home/HomeVideo";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const Home = () => {
  const { isLoading, categories, siteSettings, featuredProducts, featured, freeShipping, recent } = useHomeData();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <MarqueeTicker />
      <HeroBanners />
      <TrustBadges />
      <CategoriesSection categories={categories} />
      <NextBikeBanner />

      {/* DESTACADOS */}
      {(isLoading || featuredProducts.length > 0) && (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <ProductCarousel
            className="py-24"
            isLoading={isLoading}
            prioritizeFirst
            products={featuredProducts}
            header={
              <div className="container px-4 md:px-6 flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <Star className="h-8 w-8 text-yellow-500" fill="currentColor" />
                  <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Destacados</h3>
                </div>
                <Link to="/productos" className="text-primary"><ChevronRight size={32} /></Link>
              </div>
            }
          />
        </motion.div>
      )}

      {/* SUPER OFERTAS */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
        <ProductCarousel
          className="bg-foreground py-16 md:py-20 rounded-[3rem] md:rounded-[5rem] mx-2 md:mx-10 my-10"
          isLoading={isLoading}
          products={featured}
          header={
            <div className="container max-w-[1300px] px-4 md:px-6">
              <div className="flex items-center justify-between mb-10 px-2">
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic text-background">
                  <span className="text-primary">Super</span> Ofertas
                </h3>
                <Link to="/productos" className="text-primary"><ChevronRight size={32} /></Link>
              </div>
            </div>
          }
        />
      </motion.div>

      {/* ENVÍO GRATIS */}
      {(isLoading || freeShipping.length > 0) && (
        <ProductCarousel
          className="py-16 md:py-20"
          isLoading={isLoading}
          products={freeShipping}
          skeletonCount={4}
          header={
            <div className="container px-4 md:px-6 flex items-center gap-4 mb-10">
              <Truck className="h-8 w-8 text-yellow-400" />
              <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Envío sin cargo</h3>
            </div>
          }
        />
      )}

      {/* RECIENTES */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
        <ProductCarousel
          className="py-16 md:py-20"
          isLoading={isLoading}
          products={recent}
          header={
            <div className="container px-4 md:px-6 flex items-center justify-between mb-10">
              <div>
                <span className="text-primary font-black uppercase text-xs tracking-[0.2em]">Catálogo</span>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
                  Todos los <span className="text-primary">Productos</span>
                </h3>
              </div>
              <Link to="/productos" className="flex items-center gap-2 text-primary font-black uppercase text-sm tracking-tight hover:underline">
                Ver todos <ChevronRight size={20} />
              </Link>
            </div>
          }
        />
      </motion.div>

      {siteSettings?.home_media_url && <HomeVideo url={siteSettings.home_media_url} />}
    </div>
  );
};

export default Home;
