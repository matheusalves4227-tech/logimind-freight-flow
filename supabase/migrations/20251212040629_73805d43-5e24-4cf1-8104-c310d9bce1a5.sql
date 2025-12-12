-- Tornar o bucket payment-proofs público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Adicionar política de leitura pública para os comprovantes
CREATE POLICY "Public can view payment proofs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment-proofs');