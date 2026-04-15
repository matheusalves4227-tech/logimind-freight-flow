
-- =============================================
-- ÍNDICES DE PERFORMANCE PARA ESCALABILIDADE
-- =============================================

-- 1. GEOLOCALIZAÇÃO: índice composto para queries de localização em tempo real (Mapbox tracking)
CREATE INDEX IF NOT EXISTS idx_orders_geolocation 
ON public.orders (current_latitude, current_longitude) 
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- 2. GEOLOCALIZAÇÃO: índice para última atualização de localização (ordenação por recência)
CREATE INDEX IF NOT EXISTS idx_orders_location_update 
ON public.orders (last_location_update DESC NULLS LAST) 
WHERE last_location_update IS NOT NULL;

-- 3. MATCH DE MOTORISTAS: índice composto para busca de motoristas aprovados com estado
CREATE INDEX IF NOT EXISTS idx_driver_profiles_status_state 
ON public.driver_profiles (status, address_state);

-- 4. ORDERS: índice composto para pedidos ativos por motorista (usado no match-drivers)
CREATE INDEX IF NOT EXISTS idx_orders_active_driver 
ON public.orders (driver_id, status) 
WHERE status IN ('confirmed', 'in_transit', 'out_for_delivery') AND driver_id IS NOT NULL;

-- 5. ORDERS: índice composto para RLS (user_id + status) - query mais frequente do dashboard
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON public.orders (user_id, status);

-- 6. ORDERS: índice para busca por CEPs de origem/destino (cotação e rota)
CREATE INDEX IF NOT EXISTS idx_orders_origin_cep 
ON public.orders (origin_cep);

CREATE INDEX IF NOT EXISTS idx_orders_destination_cep 
ON public.orders (destination_cep);

-- 7. TRACKING: índice composto para timeline (order_id + timestamp DESC)
CREATE INDEX IF NOT EXISTS idx_tracking_events_order_timeline 
ON public.tracking_events (order_id, event_timestamp DESC);

-- 8. DRIVER VEHICLES: índice composto para match de capacidade
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_capacity 
ON public.driver_vehicles (driver_profile_id, max_weight_kg DESC) 
WHERE is_active = true;

-- 9. FINANCIAL: índice para repasses pendentes (query administrativa frequente)
CREATE INDEX IF NOT EXISTS idx_orders_repasse_pendente 
ON public.orders (repasse_data_limite ASC NULLS LAST) 
WHERE status = 'delivered' AND valor_repasse_liquido IS NOT NULL;

-- 10. PERFORMANCE SCORES: índice para ranking de motoristas
CREATE INDEX IF NOT EXISTS idx_driver_performance_ranking 
ON public.driver_performance_scores (overall_score DESC, total_deliveries DESC);

-- 11. USER ROLES: índice composto para has_role() (chamada em TODAS as policies RLS)
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON public.user_roles (user_id, role);
