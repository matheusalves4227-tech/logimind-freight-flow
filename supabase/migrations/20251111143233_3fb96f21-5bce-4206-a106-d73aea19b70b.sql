-- Add RLS policies for admins to view all quotes and orders

-- Policy for admins to view all quotes
CREATE POLICY "Admins can view all quotes"
ON public.quotes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to view all quote_items
CREATE POLICY "Admins can view all quote items"
ON public.quote_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));