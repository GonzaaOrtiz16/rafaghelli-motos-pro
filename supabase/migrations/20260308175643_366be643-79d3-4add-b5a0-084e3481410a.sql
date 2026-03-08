
-- Agregar columnas a categorias
ALTER TABLE public.categorias 
  ADD COLUMN IF NOT EXISTS image text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'repuestos';

-- RLS policies para categorias (actualmente no tiene ninguna)
CREATE POLICY "Public read categorias" ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert categorias" ON public.categorias FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update categorias" ON public.categorias FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Public delete categorias" ON public.categorias FOR DELETE TO anon, authenticated USING (true);

-- Habilitar RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
