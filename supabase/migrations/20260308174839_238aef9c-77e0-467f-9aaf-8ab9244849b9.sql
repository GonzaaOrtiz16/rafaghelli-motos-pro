
-- Tabla de motos
CREATE TABLE public.motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  kilometers integer NOT NULL DEFAULT 0,
  price numeric NOT NULL,
  images text[] DEFAULT '{}',
  condition text NOT NULL DEFAULT 'Usada',
  description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read motorcycles" ON public.motorcycles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert motorcycles" ON public.motorcycles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update motorcycles" ON public.motorcycles FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete motorcycles" ON public.motorcycles FOR DELETE TO anon, authenticated USING (true);

-- Tabla de ajustes del sitio
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_media_url text DEFAULT '',
  home_media_type text DEFAULT 'image',
  updated_at timestamptz DEFAULT timezone('utc', now())
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public update site_settings" ON public.site_settings FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public insert site_settings" ON public.site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Insertar registro por defecto
INSERT INTO public.site_settings (home_media_url, home_media_type) VALUES ('', 'image');
