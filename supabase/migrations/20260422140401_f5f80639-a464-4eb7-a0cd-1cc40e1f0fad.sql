
-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Datos del comprador
  buyer_name text NOT NULL,
  buyer_dni text,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL,
  
  -- Envío
  shipping_method text NOT NULL DEFAULT 'mercado_envios', -- 'mercado_envios' | 'pickup'
  shipping_street text,
  shipping_number text,
  shipping_apartment text,
  shipping_city text,
  shipping_state text,
  shipping_zip text,
  shipping_notes text,
  shipping_cost numeric NOT NULL DEFAULT 0,
  shipping_tracking text,
  
  -- Totales
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  
  -- Pago
  payment_method text NOT NULL DEFAULT 'mercado_pago',
  payment_status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | cancelled | refunded | in_process
  mp_preference_id text,
  mp_payment_id text,
  mp_payment_type text, -- credit_card, debit_card, account_money, ticket
  
  -- Estado de fulfillment
  fulfillment_status text NOT NULL DEFAULT 'pending', -- pending | preparing | shipped | delivered | cancelled
  
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_mp_preference_id ON public.orders(mp_preference_id);
CREATE INDEX idx_orders_buyer_email ON public.orders(buyer_email);

-- ============================================
-- TABLA: order_items
-- ============================================
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  product_image text,
  variant text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una orden (checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Usuarios logueados ven sus órdenes; admin/encargado ven todas
CREATE POLICY "Users see own orders, staff sees all"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'encargado')
  )
);

CREATE POLICY "Users see own order items, staff sees all"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'encargado')
      )
    )
  )
);

-- Solo staff puede actualizar órdenes manualmente
CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'encargado')
  )
);

CREATE POLICY "Staff can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'encargado')
  )
);

-- Lectura pública de orders por mp_preference_id (necesario para callbacks de MP que vuelven sin sesión a /checkout/success)
CREATE POLICY "Public can read order by preference for callback"
ON public.orders FOR SELECT
TO anon
USING (mp_preference_id IS NOT NULL);

-- ============================================
-- TRIGGER: descuento de stock cuando se aprueba
-- ============================================
CREATE OR REPLACE FUNCTION public.apply_stock_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  -- De pendiente a aprobado: descontar stock
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'approved') THEN
    FOR item IN SELECT product_id, quantity, product_title FROM public.order_items WHERE order_id = NEW.id LOOP
      IF item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock = GREATEST(COALESCE(stock, 0) - item.quantity, 0)
        WHERE id = item.product_id;

        INSERT INTO public.stock_movements (product_id, movement_type, quantity, reason, seller_name)
        VALUES (item.product_id, 'sale', -item.quantity, 'Venta web orden ' || NEW.id::text, NEW.buyer_name);
      END IF;
    END LOOP;
    NEW.approved_at := now();
  END IF;

  -- De aprobado a cancelado/rechazado: devolver stock
  IF OLD.payment_status = 'approved' AND NEW.payment_status IN ('cancelled', 'refunded', 'rejected') THEN
    FOR item IN SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      IF item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock = COALESCE(stock, 0) + item.quantity
        WHERE id = item.product_id;

        INSERT INTO public.stock_movements (product_id, movement_type, quantity, reason, seller_name)
        VALUES (item.product_id, 'return', item.quantity, 'Devolución orden ' || NEW.id::text, NEW.buyer_name);
      END IF;
    END LOOP;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_stock_change
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.apply_stock_on_order_status_change();

-- ============================================
-- Trigger updated_at en INSERT
-- ============================================
CREATE OR REPLACE FUNCTION public.set_orders_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
