-- ============================================================================
-- CORREÇÕES DE SEGURANÇA E PERFORMANCE - PARTE 1: ÍNDICES E NORMALIZAÇÃO
-- ============================================================================

-- 1. NORMALIZAR DADOS EXISTENTES (remover hífens de CEPs)
-- ============================================================================
UPDATE public.orders 
SET origin_cep = REPLACE(origin_cep, '-', '')
WHERE origin_cep LIKE '%-%';

UPDATE public.orders 
SET destination_cep = REPLACE(destination_cep, '-', '')
WHERE destination_cep LIKE '%-%';

UPDATE public.quotes 
SET origin_cep = REPLACE(origin_cep, '-', '')
WHERE origin_cep LIKE '%-%';

UPDATE public.quotes 
SET destination_cep = REPLACE(destination_cep, '-', '')
WHERE destination_cep LIKE '%-%';

UPDATE public.driver_profiles 
SET address_cep = REPLACE(address_cep, '-', '')
WHERE address_cep LIKE '%-%';

UPDATE public.b2b_carriers 
SET address_cep = REPLACE(address_cep, '-', '')
WHERE address_cep LIKE '%-%';

-- 2. PERFORMANCE: Adicionar índices críticos para queries frequentes
-- ============================================================================

-- Índices para tabela orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_carrier_id ON public.orders(carrier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_status_pagamento ON public.orders(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON public.orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Índice composto para queries de admin
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON public.orders(status, status_pagamento) 
WHERE status = 'ENTREGUE' AND status_pagamento = 'PENDENTE_REPASSE';

-- Índices para tabela tracking_events
CREATE INDEX IF NOT EXISTS idx_tracking_events_order_id ON public.tracking_events(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON public.tracking_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_critical ON public.tracking_events(is_critical) 
WHERE is_critical = true;

-- Índices para tabela financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_order_id ON public.financial_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_processed_at ON public.financial_transactions(processed_at DESC);

-- Índices para tabela driver_profiles
CREATE INDEX IF NOT EXISTS idx_driver_profiles_user_id ON public.driver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status ON public.driver_profiles(status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_cpf ON public.driver_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_email ON public.driver_profiles(email);

-- Índices para tabela carrier_price_table
CREATE INDEX IF NOT EXISTS idx_carrier_price_origin_dest ON public.carrier_price_table(origin_state, destination_state);
CREATE INDEX IF NOT EXISTS idx_carrier_price_active ON public.carrier_price_table(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_carrier_price_carrier_id ON public.carrier_price_table(carrier_id);

-- Índices para tabela quotes
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- Índices para tabela quote_items
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_carrier_id ON public.quote_items(carrier_id);

-- Índices para tabela user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Índices para tabela driver_vehicles
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_profile_id ON public.driver_vehicles(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_active ON public.driver_vehicles(is_active) WHERE is_active = true;

-- Índices para tabela driver_documents
CREATE INDEX IF NOT EXISTS idx_driver_documents_profile_id ON public.driver_documents(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_verified ON public.driver_documents(is_verified);

-- Índices para tabela b2b_carriers
CREATE INDEX IF NOT EXISTS idx_b2b_carriers_user_id ON public.b2b_carriers(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_carriers_status ON public.b2b_carriers(status);
CREATE INDEX IF NOT EXISTS idx_b2b_carriers_cnpj ON public.b2b_carriers(cnpj);

-- Índices para tabelas de reviews
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver_id ON public.driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_order_id ON public.driver_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_carrier_reviews_carrier_id ON public.carrier_reviews(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_reviews_order_id ON public.carrier_reviews(order_id);

-- 3. ATUALIZAR ESTATÍSTICAS
-- ============================================================================
ANALYZE public.orders;
ANALYZE public.tracking_events;
ANALYZE public.financial_transactions;
ANALYZE public.driver_profiles;
ANALYZE public.carrier_price_table;
ANALYZE public.quotes;
ANALYZE public.quote_items;