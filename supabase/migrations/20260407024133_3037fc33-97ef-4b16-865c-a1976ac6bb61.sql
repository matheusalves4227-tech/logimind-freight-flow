
-- 1. CRITICAL: Remove the misconfigured public storage policy exposing driver documents
DROP POLICY IF EXISTS "Admins can view all driver documents" ON storage.objects;

-- 2. Fix delivery photos upload - restrict to assigned driver only
DROP POLICY IF EXISTS "Authenticated drivers can upload delivery photos" ON storage.objects;
CREATE POLICY "Assigned drivers can upload delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.driver_profiles dp ON dp.id = o.driver_id
    WHERE dp.user_id = auth.uid()
      AND o.id::text = (storage.foldername(name))[1]
  )
);

-- 3. Remove client-side INSERT on financial_transactions (should be server-side only)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.financial_transactions;
