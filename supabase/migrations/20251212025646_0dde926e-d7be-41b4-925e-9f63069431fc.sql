-- 1. Tornar o bucket payment-proofs privado
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';

-- 2. Criar policies RLS para o bucket payment-proofs
-- Policy: Proprietários do pedido podem ver seus próprios comprovantes
CREATE POLICY "Order owners can view their payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.user_id = auth.uid() 
    AND storage.objects.name LIKE orders.id::text || '%'
  )
);

-- Policy: Admins podem ver todos os comprovantes
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Usuários autenticados podem fazer upload de comprovantes para seus pedidos
CREATE POLICY "Users can upload payment proofs for their orders"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Proprietários podem atualizar seus comprovantes
CREATE POLICY "Order owners can update their payment proofs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'payment-proofs' 
  AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.user_id = auth.uid() 
    AND storage.objects.name LIKE orders.id::text || '%'
  )
);