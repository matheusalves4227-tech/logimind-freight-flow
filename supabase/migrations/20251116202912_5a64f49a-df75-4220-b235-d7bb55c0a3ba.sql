-- Criar bucket para fotos de perfil dos motoristas
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-profiles', 'driver-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para fotos de perfil
CREATE POLICY "Motoristas podem fazer upload de suas próprias fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Fotos de perfil são públicas para visualização"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'driver-profiles');

CREATE POLICY "Motoristas podem atualizar suas próprias fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Motoristas podem deletar suas próprias fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);