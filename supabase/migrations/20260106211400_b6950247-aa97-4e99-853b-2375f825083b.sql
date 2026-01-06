-- Adicionar campos de geolocalização para foto de entrega
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS foto_entrega_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS foto_entrega_longitude DECIMAL(11, 8);