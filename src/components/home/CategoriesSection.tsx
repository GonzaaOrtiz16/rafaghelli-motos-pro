import CategoryGrid from "@/components/CategoryGrid";

const CategoriesSection = ({ categories }: { categories: any[] }) => (
  <section className="container py-20 px-6">
    <div className="flex items-end justify-between mb-12">
      <div>
        <span className="text-primary font-black uppercase text-xs tracking-[0.2em]">Explorar</span>
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Categorías</h3>
      </div>
    </div>
    <CategoryGrid categories={categories} />
  </section>
);

export default CategoriesSection;
