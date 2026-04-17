import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getThumbnailUrl(url: string | null): string {
  if (!url) return "";
  // Convertir URL pública de Supabase Storage al endpoint de transformación
  // /storage/v1/object/public/... -> /storage/v1/render/image/public/...
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const separator = transformed.includes("?") ? "&" : "?";
    return `${transformed}${separator}width=300&height=300&resize=cover&quality=75`;
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
  const [src, setSrc] = useState(() => getThumbnailUrl(cat.image));
  const hasImage = Boolean(cat.image);

  return (
    <Link
      to={`/productos?categoria=${encodeURIComponent(cat.nombre)}`}
      className="group flex flex-col items-center text-center gap-3"
    >
      <div className="relative aspect-square w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-muted border-4 border-transparent group-hover:border-primary transition-all duration-500 shadow-lg">
        {hasImage ? (
          <>
            {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
            <img
              src={src}
              alt={cat.nombre}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => {
                if (cat.image && src !== cat.image) {
                  setSrc(cat.image);
                } else {
                  setLoaded(true);
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-muted-foreground">
            {cat.nombre.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground">
        {cat.nombre}
      </span>
    </Link>
  );
});

CategoryItem.displayName = "CategoryItem";

const CategoryGrid = React.memo(({ categories }: { categories: Category[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Check on mount & when categories change
  React.useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className="relative group/carousel">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => (
          <div key={cat.id} className="snap-start flex-shrink-0 w-24 sm:w-28 md:w-40">
            <CategoryItem cat={cat} />
          </div>
        ))}
      </div>

      {/* Navigation arrows - desktop only, visible on hover when scrollable */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-card border border-border shadow-xl rounded-full h-10 w-10 items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover/carousel:opacity-100"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-card border border-border shadow-xl rounded-full h-10 w-10 items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover/carousel:opacity-100"
          aria-label="Siguiente"
        >
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
