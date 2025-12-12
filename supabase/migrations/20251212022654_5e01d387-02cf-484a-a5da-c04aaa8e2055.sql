-- Drop existing overly permissive policy on payment-proofs bucket
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Create restrictive policy: only order owner and admins can view payment proofs
-- Files should be stored as /{order_id}/{filename}
CREATE POLICY "Order owners and admins can view payment proofs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-proofs' 
  AND (
    -- Admin access
    public.has_role(auth.uid(), 'admin')
    OR
    -- Order owner access (file path starts with order_id owned by user)
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.user_id = auth.uid() 
      AND orders.id::text = (storage.foldername(name))[1]
    )
  )
);