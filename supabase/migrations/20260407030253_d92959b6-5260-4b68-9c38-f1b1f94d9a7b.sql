DROP POLICY IF EXISTS "Public can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload payment proofs for their orders" ON storage.objects;
DROP POLICY IF EXISTS "Order owners can view their payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Order owners and admins can view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Order owners can update their payment proofs" ON storage.objects;

CREATE POLICY "Order owners can upload payment proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND o.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Order owners can view payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND o.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Order owners can update payment proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND o.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND o.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Admins can view payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete payment proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

DROP TRIGGER IF EXISTS protect_order_financial_fields_trigger ON public.orders;
CREATE TRIGGER protect_order_financial_fields_trigger
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_order_financial_fields();