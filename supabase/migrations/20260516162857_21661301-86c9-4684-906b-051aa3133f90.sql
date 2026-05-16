
-- 1. Nueva tabla normalizada
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC,
  image TEXT,
  sku TEXT,
  moto_fit TEXT[] DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Una sola fila por combinación color+talle por producto
CREATE UNIQUE INDEX product_variants_unique_combo
  ON public.product_variants (
    product_id,
    COALESCE(color, ''),
    COALESCE(size, '')
  );

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants publicly readable"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Staff manage variants insert"
  ON public.product_variants FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'encargado')
  ));

CREATE POLICY "Staff manage variants update"
  ON public.product_variants FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'encargado')
  ));

CREATE POLICY "Staff manage variants delete"
  ON public.product_variants FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'encargado')
  ));

-- Trigger genérico de updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. Función que recalcula products.stock como suma de variantes
CREATE OR REPLACE FUNCTION public.recalc_product_stock(_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_sum INTEGER;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(stock), 0)
    INTO v_count, v_sum
    FROM public.product_variants
   WHERE product_id = _product_id;

  -- Si no hay variantes, no tocamos el stock manual del producto
  IF v_count > 0 THEN
    UPDATE public.products
       SET stock = v_sum
     WHERE id = _product_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_recalc_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_product_stock(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_product_stock(NEW.product_id);
    IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
      PERFORM public.recalc_product_stock(OLD.product_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER product_variants_recalc_stock
  AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.tg_recalc_product_stock();

-- 3. Migrar datos del JSONB variants actual a la nueva tabla
DO $$
DECLARE
  p RECORD;
  v JSONB;
  size_key TEXT;
  size_val JSONB;
  pos INTEGER;
BEGIN
  FOR p IN SELECT id, variants FROM public.products
           WHERE variants IS NOT NULL AND jsonb_typeof(variants) = 'array' AND jsonb_array_length(variants) > 0
  LOOP
    pos := 0;
    FOR v IN SELECT * FROM jsonb_array_elements(p.variants)
    LOOP
      IF v ? 'sizes' AND jsonb_typeof(v->'sizes') = 'object' AND (SELECT count(*) FROM jsonb_object_keys(v->'sizes')) > 0 THEN
        FOR size_key, size_val IN SELECT * FROM jsonb_each(v->'sizes')
        LOOP
          INSERT INTO public.product_variants
            (product_id, color, size, stock, price, image, moto_fit, position)
          VALUES (
            p.id,
            NULLIF(v->>'color', ''),
            size_key,
            COALESCE((size_val)::text::integer, 0),
            NULLIF(v->>'price', '')::numeric,
            NULLIF(v->>'image', ''),
            COALESCE(ARRAY(SELECT jsonb_array_elements_text(v->'moto_fit')), '{}'),
            pos
          )
          ON CONFLICT DO NOTHING;
          pos := pos + 1;
        END LOOP;
      ELSE
        INSERT INTO public.product_variants
          (product_id, color, size, stock, price, image, moto_fit, position)
        VALUES (
          p.id,
          NULLIF(v->>'color', ''),
          NULL,
          COALESCE((v->>'stock')::integer, 0),
          NULLIF(v->>'price', '')::numeric,
          NULLIF(v->>'image', ''),
          COALESCE(ARRAY(SELECT jsonb_array_elements_text(v->'moto_fit')), '{}'),
          pos
        )
        ON CONFLICT DO NOTHING;
        pos := pos + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;
