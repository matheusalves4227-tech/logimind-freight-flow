-- Add LogiGuard Pro fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS logiguard_pro_contratado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS logiguard_pro_valor NUMERIC DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.logiguard_pro_contratado IS 'Whether LogiGuard Pro was contracted for this order';
COMMENT ON COLUMN public.orders.logiguard_pro_valor IS 'Value of LogiGuard Pro service if contracted';