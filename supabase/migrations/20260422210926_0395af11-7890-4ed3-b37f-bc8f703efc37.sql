ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;

ALTER TABLE public.stock_movements
  ADD CONSTRAINT stock_movements_movement_type_check
  CHECK (movement_type = ANY (ARRAY['venta'::text, 'ingreso'::text, 'anulacion'::text, 'correccion'::text, 'sale'::text, 'return'::text]));