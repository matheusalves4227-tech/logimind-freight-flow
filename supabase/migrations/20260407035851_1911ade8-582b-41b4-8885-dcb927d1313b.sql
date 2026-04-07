-- 1. Add DELETE policy on user_roles for admins
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict tracking_events SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view tracking events for their orders" ON public.tracking_events;

CREATE POLICY "Users can view tracking events for their orders"
ON public.tracking_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = tracking_events.order_id
    AND orders.user_id = auth.uid()
  )
);