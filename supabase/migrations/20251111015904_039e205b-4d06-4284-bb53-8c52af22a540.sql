-- Criar tabela de pedidos/fretes
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  quote_id UUID REFERENCES public.quotes(id),
  carrier_id UUID REFERENCES public.carriers(id),
  
  -- Tipo de serviço e veículo
  service_type TEXT NOT NULL CHECK (service_type IN ('ltl', 'ftl')),
  vehicle_type TEXT,
  
  -- Informações de origem e destino
  origin_cep TEXT NOT NULL,
  origin_address TEXT NOT NULL,
  destination_cep TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  
  -- Dados da carga
  weight_kg NUMERIC NOT NULL,
  height_cm NUMERIC,
  width_cm NUMERIC,
  length_cm NUMERIC,
  
  -- Preços
  base_price NUMERIC NOT NULL,
  commission_applied NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  
  -- Status e datas
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed')),
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  
  -- Rastreamento externo
  external_tracking_code TEXT,
  carrier_name TEXT NOT NULL,
  
  -- Motorista autônomo (para FTL)
  driver_name TEXT,
  driver_phone TEXT,
  
  -- Localização atual (para rastreamento em tempo real)
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  last_location_update TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de eventos de rastreamento
CREATE TABLE public.tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Dados do evento
  event_code TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Localização do evento
  city TEXT,
  state TEXT,
  
  -- Flags de ocorrência
  is_critical BOOLEAN DEFAULT false,
  
  -- Dados brutos da fonte original (para debug)
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_tracking_events_order_id ON public.tracking_events(order_id);
CREATE INDEX idx_tracking_events_timestamp ON public.tracking_events(event_timestamp DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies para orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies para tracking_events
CREATE POLICY "Users can view tracking events for their orders"
ON public.tracking_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = tracking_events.order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert tracking events"
ON public.tracking_events
FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();