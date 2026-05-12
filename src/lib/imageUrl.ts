// Optimize product image URLs for faster loading.
// VTEX (vteximg.com.br) supports resizing via path: /arquivos/ids/{id}-{w}-{h}/...
// Unsplash supports ?w=&q=&auto=format params.
// Supabase storage supports ?width=&quality= via /render/image (when enabled), fallback returns original.
export function optimizeImage(url: string | undefined | null, width = 500): string {
  if (!url) return "/placeholder.svg";
  try {
    // VTEX
    if (url.includes("vteximg.com.br") && /\/arquivos\/ids\/(\d+)\//.test(url)) {
      return url.replace(/\/arquivos\/ids\/(\d+)\//, `/arquivos/ids/$1-${width}-${width}/`);
    }
    // Unsplash
    if (url.includes("images.unsplash.com")) {
      const u = new URL(url);
      u.searchParams.set("w", String(width));
      u.searchParams.set("q", "70");
      u.searchParams.set("auto", "format");
      u.searchParams.set("fit", "crop");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}
