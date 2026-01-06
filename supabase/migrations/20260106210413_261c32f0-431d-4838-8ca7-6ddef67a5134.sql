-- Criar bucket para fotos de entrega (comprovantes)
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para motoristas fazerem upload de fotos de entrega
CREATE POLICY "Motoristas podem fazer upload de fotos de entrega"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  auth.uid() IS NOT NULL
);

-- Política para leitura pública das fotos de entrega
CREATE POLICY "Fotos de entrega são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-photos');

-- Adicionar coluna para URL da foto de entrega na tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS foto_entrega_url TEXT;

-- Adicionar coluna para timestamp da foto de entrega
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS foto_entrega_timestamp TIMESTAMPTZ;