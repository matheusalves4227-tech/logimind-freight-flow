-- Criar bucket para comprovantes de pagamento
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Qualquer usuário autenticado pode ver comprovantes
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Policy: Usuários autenticados podem fazer upload de comprovantes
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Admins podem deletar comprovantes
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-proofs' 
  AND has_role(auth.uid(), 'admin')
);