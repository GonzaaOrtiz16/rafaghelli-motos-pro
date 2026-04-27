-- Tabla de logs de envío de emails
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  order_id uuid,
  recipient_email text NOT NULL,
  recipient_type text NOT NULL, -- 'owner' | 'buyer'
  subject text,
  status text NOT NULL, -- 'sent' | 'failed' | 'skipped'
  resend_id text,
  error_message text,
  source text -- 'mp-webhook' | 'verify-mp-payment'
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Solo admin/encargado pueden leer
CREATE POLICY "Staff puede leer email_logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin'::text, 'encargado'::text])
  ));

-- Inserción libre (las edge functions usan service role igual)
CREATE POLICY "Public insert email_logs"
  ON public.email_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX idx_email_logs_order_id ON public.email_logs (order_id);