
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS wants_newsletter boolean DEFAULT false;
