-- Remove a constraint existente e recria com 'rejected' incluído
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_transit'::text, 'delivered'::text, 'cancelled'::text, 'failed'::text, 'rejected'::text]));