import { useCallback, useId, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface ProductCarouselProps {
  products: any[];
  header: ReactNode;
  isLoading?: boolean;
  prioritizeFirst?: boolean;
  skeletonCount?: number;
  className?: string;
}

const SkeletonCard = () => (
  <div className="w-[45vw] md:w-[280px] lg:w-[300px] shrink-0">
    <div className="bg-card rounded-[2rem] overflow-hidden border border-border">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
        <div className="h-5 w-1/2 bg-muted animate-pulse rounded mt-3" />
      </div>
    </div>
  </div>
);

const ProductCarousel = ({
  products,
  header,
  isLoading,
  prioritizeFirst,
  skeletonCount = 6,
  className = "",
}: ProductCarouselProps) => {
  const reactId = useId();
  const scrollId = `carousel-${reactId.replace(/:/g, "")}`;

  const scroll = useCallback(
    (dir: "left" | "right") => {
      const el = document.getElementById(scrollId);
      if (el) el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    },
    [scrollId]
  );

  return (
    <section className={className}>
      {header}
      <div className="relative group/carousel">
        <div id={scrollId} className="overflow-x-auto scrollbar-hide scroll-smooth">
          <div className="flex gap-4 md:gap-8 px-4 md:px-6 w-max">
            {isLoading && products.length === 0
              ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
              : products.map((p, i) => (
                  <div key={p.id} className="w-[45vw] md:w-[280px] lg:w-[300px] shrink-0">
                    <ProductCard product={{ ...p, priority: prioritizeFirst && i < 4 }} />
                  </div>
                ))}
          </div>
        </div>
        <button
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label="Siguiente"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
};

export default ProductCarousel;
