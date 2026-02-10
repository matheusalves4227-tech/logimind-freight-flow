
-- =============================================
-- 1. Tornar buckets sensíveis PRIVADOS
-- =============================================
UPDATE storage.buckets SET public = false WHERE id IN ('payment-proofs', 'delivery-photos');

-- =============================================
-- 2. Remover políticas SELECT públicas inseguras
-- =============================================

-- delivery-photos: remover acesso público irrestrito
DROP POLICY IF EXISTS "Fotos de entrega são públicas" ON storage.objects;

-- driver-profiles: remover acesso público irrestrito  
DROP POLICY IF EXISTS "Fotos de perfil são públicas para visualização" ON storage.objects;

-- =============================================
-- 3. Criar políticas seguras para delivery-photos
-- =============================================

-- Admins podem ver todas as fotos de entrega
CREATE POLICY "Admins can view all delivery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Donos do pedido podem ver fotos de entrega do seu pedido
CREATE POLICY "Order owners can view delivery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.user_id = auth.uid()
    AND (storage.foldername(name))[1] = orders.id::text
  )
);

-- Motoristas podem ver fotos que eles mesmos enviaram
CREATE POLICY "Drivers can view own delivery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Corrigir policy de upload (era para role public, mudar para authenticated)
DROP POLICY IF EXISTS "Motoristas podem fazer upload de fotos de entrega" ON storage.objects;

CREATE POLICY "Authenticated drivers can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos'
  AND auth.uid() IS NOT NULL
);

-- =============================================
-- 4. Criar políticas seguras para driver-profiles
-- =============================================

-- Motoristas aprovados têm fotos visíveis (para exibir no app)
CREATE POLICY "Approved driver profiles are viewable"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-profiles'
  AND (
    -- Próprio motorista
    (storage.foldername(name))[1] = auth.uid()::text
    -- Ou admin
    OR public.has_role(auth.uid(), 'admin')
    -- Ou motorista aprovado (foto pública no app)
    OR EXISTS (
      SELECT 1 FROM public.driver_profiles
      WHERE driver_profiles.user_id::text = (storage.foldername(name))[1]
      AND driver_profiles.status = 'approved'
    )
  )
);
