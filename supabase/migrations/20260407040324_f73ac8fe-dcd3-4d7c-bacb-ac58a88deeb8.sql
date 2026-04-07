-- Restrict carrier_price_table SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view active carrier prices" ON public.carrier_price_table;

CREATE POLICY "Authenticated users can view active carrier prices"
ON public.carrier_price_table
FOR SELECT
TO authenticated
USING (is_active = true);