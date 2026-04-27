-- Add cargo description and type to orders (B2C single freight)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cargo_description TEXT,
  ADD COLUMN IF NOT EXISTS cargo_type TEXT,
  ADD COLUMN IF NOT EXISTS cargo_value NUMERIC;

-- Add merchandise description to b2b_quotes (tipo_carga and valor_medio_carga already exist)
ALTER TABLE public.b2b_quotes
  ADD COLUMN IF NOT EXISTS descricao_mercadoria TEXT;