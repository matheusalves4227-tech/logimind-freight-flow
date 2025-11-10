-- Create carriers table
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  coverage_area TEXT,
  avg_quality_rating DECIMAL(3,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(3,2) DEFAULT 0,
  damage_rate DECIMAL(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create routes table (for dynamic pricing factors)
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_cep TEXT NOT NULL,
  destination_cep TEXT NOT NULL,
  route_type TEXT NOT NULL, -- 'return', 'high_competition', 'standard'
  adjustment_factor DECIMAL(4,3) DEFAULT 0, -- Factor for commission adjustment (0.0 to 1.0)
  demand_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(origin_cep, destination_cep)
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_cep TEXT NOT NULL,
  destination_cep TEXT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  height_cm DECIMAL(10,2),
  width_cm DECIMAL(10,2),
  length_cm DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quote_items table (individual carrier quotes)
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL, -- Price from carrier
  commission_applied DECIMAL(4,3) NOT NULL, -- Commission percentage applied
  final_price DECIMAL(10,2) NOT NULL, -- Final price to customer
  delivery_days INTEGER NOT NULL,
  quality_index DECIMAL(3,2), -- 0-5 rating
  route_adjustment_factor DECIMAL(4,3), -- Factor used for this route
  selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carriers (public read)
CREATE POLICY "Carriers are viewable by everyone"
  ON public.carriers FOR SELECT
  USING (is_active = true);

-- RLS Policies for routes (public read for active routes)
CREATE POLICY "Routes are viewable by everyone"
  ON public.routes FOR SELECT
  USING (true);

-- RLS Policies for quotes (users can only see their own)
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for quote_items (users can only see items from their quotes)
CREATE POLICY "Users can view quote items from their quotes"
  ON public.quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quote items for their quotes"
  ON public.quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotes
      WHERE quotes.id = quote_items.quote_id
      AND quotes.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);
CREATE INDEX idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX idx_routes_ceps ON public.routes(origin_cep, destination_cep);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample carriers data
INSERT INTO public.carriers (name, logo_url, coverage_area, avg_quality_rating, on_time_delivery_rate, damage_rate) VALUES
  ('Express Log', NULL, 'Nacional', 5.0, 0.98, 0.01),
  ('Rápido Trans', NULL, 'Nacional', 4.2, 0.92, 0.03),
  ('EconoFrete', NULL, 'Nacional', 3.8, 0.85, 0.05),
  ('Cargo Prime', NULL, 'Sul/Sudeste', 4.7, 0.95, 0.02),
  ('LogiFast', NULL, 'Nacional', 4.5, 0.94, 0.02);

-- Insert sample routes with different adjustment factors
INSERT INTO public.routes (origin_cep, destination_cep, route_type, adjustment_factor, demand_level) VALUES
  ('01000-000', '04000-000', 'standard', 0.0, 'high'),
  ('04000-000', '01000-000', 'return', 0.7, 'low'),
  ('01000-000', '20000-000', 'high_competition', 0.3, 'high'),
  ('80000-000', '90000-000', 'return', 0.8, 'low'),
  ('30000-000', '40000-000', 'standard', 0.1, 'medium');