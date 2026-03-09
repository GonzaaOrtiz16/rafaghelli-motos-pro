import React, { useState } from "react";
import { Link } from "react-router-dom";

const SUPABASE_STORAGE_HOST = "supabase.co/storage";

function getThumbnailUrl(url: string | null): string {
  if (!url) return "";
  if (url.includes(SUPABASE_STORAGE_HOST)) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}width=200&height=200&resize=cover`;
  }
  return url;
}

interface Category {
  id: string;
  nombre: string;
  image: string | null;
}

const CategoryItem = React.memo(({ cat }: { cat: Category }) => {
  const [loaded, setLoaded] = useState(false);
  const thumbUrl = getThumbnailUrl(cat.image);

  return (
    <Link to={`/productos?categoria=${cat.nombre}`} className="group flex flex-col items-center text-center gap-4">
      <div className="relative aspect-square w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-muted border-4 border-transparent group-hover:border-primary transition-all duration-500 shadow-lg">
        {!loaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={thumbUrl}
          alt={cat.nombre}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">{cat.nombre}</span>
    </Link>
  );
});

CategoryItem.displayName = "CategoryItem";

const CategoryGrid = React.memo(({ categories }: { categories: Category[] }) => (
  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-8">
    {categories.map((cat) => (
      <CategoryItem key={cat.id} cat={cat} />
    ))}
  </div>
));

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
