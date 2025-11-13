-- Create carrier_price_table for storing carrier pricing data
CREATE TABLE IF NOT EXISTS public.carrier_price_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  origin_region TEXT NOT NULL, -- CEP prefix or state (e.g., "01000-000" or "SP")
  destination_region TEXT NOT NULL, -- CEP prefix or state
  min_weight_kg NUMERIC NOT NULL DEFAULT 0,
  max_weight_kg NUMERIC NOT NULL,
  base_price NUMERIC NOT NULL, -- Base price for the route
  price_per_kg NUMERIC NOT NULL DEFAULT 0, -- Additional price per kg
  delivery_days INTEGER NOT NULL, -- Estimated delivery time in business days
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carrier_price_table ENABLE ROW LEVEL SECURITY;

-- Policies for carrier_price_table
CREATE POLICY "Admins can view all carrier prices"
  ON public.carrier_price_table
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert carrier prices"
  ON public.carrier_price_table
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update carrier prices"
  ON public.carrier_price_table
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete carrier prices"
  ON public.carrier_price_table
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to view active carrier prices for quoting
CREATE POLICY "Users can view active carrier prices"
  ON public.carrier_price_table
  FOR SELECT
  USING (is_active = true);

-- Create index for faster lookups
CREATE INDEX idx_carrier_price_regions ON public.carrier_price_table(origin_region, destination_region, carrier_id);
CREATE INDEX idx_carrier_price_carrier ON public.carrier_price_table(carrier_id);

-- Add trigger for updated_at
CREATE TRIGGER update_carrier_price_table_updated_at
  BEFORE UPDATE ON public.carrier_price_table
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();