-- Tabela de reviews de motoristas
CREATE TABLE public.driver_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  vehicle_condition_rating INTEGER CHECK (vehicle_condition_rating >= 1 AND vehicle_condition_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(order_id, reviewer_user_id)
);

-- Tabela de reviews de transportadoras
CREATE TABLE public.carrier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  delivery_time_rating INTEGER CHECK (delivery_time_rating >= 1 AND delivery_time_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  support_rating INTEGER CHECK (support_rating >= 1 AND support_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(order_id, reviewer_user_id)
);

-- Tabela de performance scores (calculado automaticamente)
CREATE TABLE public.driver_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE CASCADE UNIQUE,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  review_score NUMERIC(5,2) DEFAULT 0,
  on_time_delivery_score NUMERIC(5,2) DEFAULT 0,
  acceptance_rate_score NUMERIC(5,2) DEFAULT 0,
  completion_rate_score NUMERIC(5,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.carrier_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE UNIQUE,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  review_score NUMERIC(5,2) DEFAULT 0,
  on_time_delivery_score NUMERIC(5,2) DEFAULT 0,
  damage_rate_score NUMERIC(5,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_driver_reviews_driver_id ON public.driver_reviews(driver_id);
CREATE INDEX idx_driver_reviews_order_id ON public.driver_reviews(order_id);
CREATE INDEX idx_driver_reviews_rating ON public.driver_reviews(rating);
CREATE INDEX idx_carrier_reviews_carrier_id ON public.carrier_reviews(carrier_id);
CREATE INDEX idx_carrier_reviews_order_id ON public.carrier_reviews(order_id);
CREATE INDEX idx_carrier_reviews_rating ON public.carrier_reviews(rating);
CREATE INDEX idx_driver_performance_overall_score ON public.driver_performance_scores(overall_score DESC);
CREATE INDEX idx_carrier_performance_overall_score ON public.carrier_performance_scores(overall_score DESC);

-- RLS Policies para driver_reviews
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar reviews de seus próprios pedidos"
ON public.driver_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Reviews são públicas para leitura"
ON public.driver_reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios reviews"
ON public.driver_reviews FOR UPDATE
TO authenticated
USING (reviewer_user_id = auth.uid());

-- RLS Policies para carrier_reviews
ALTER TABLE public.carrier_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar reviews de suas transportadoras"
ON public.carrier_reviews FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Reviews de transportadoras são públicas"
ON public.carrier_reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Usuários podem atualizar reviews de transportadoras"
ON public.carrier_reviews FOR UPDATE
TO authenticated
USING (reviewer_user_id = auth.uid());

-- RLS Policies para performance scores
ALTER TABLE public.driver_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Performance scores são públicas"
ON public.driver_performance_scores FOR SELECT
TO public
USING (true);

CREATE POLICY "Apenas sistema pode atualizar scores"
ON public.driver_performance_scores FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Apenas sistema pode modificar scores"
ON public.driver_performance_scores FOR UPDATE
TO authenticated
USING (false);

ALTER TABLE public.carrier_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores de transportadoras são públicos"
ON public.carrier_performance_scores FOR SELECT
TO public
USING (true);

CREATE POLICY "Sistema atualiza scores de transportadoras"
ON public.carrier_performance_scores FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Sistema modifica scores de transportadoras"
ON public.carrier_performance_scores FOR UPDATE
TO authenticated
USING (false);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_driver_reviews_updated_at
BEFORE UPDATE ON public.driver_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_reviews_updated_at
BEFORE UPDATE ON public.carrier_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_performance_updated_at
BEFORE UPDATE ON public.driver_performance_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_performance_updated_at
BEFORE UPDATE ON public.carrier_performance_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();