-- ============================================================================
-- REDESIGN: Sistema de Precificação Baseado em KM e Estados
-- ============================================================================
-- Esta migration transforma o modelo de precificação de "regiões genéricas"
-- para um sistema mais assertivo baseado em:
-- 1. Estados de origem/destino (UF)
-- 2. Distância em KM
-- 3. Peso da carga
-- ============================================================================

-- 1. Adicionar campos de cobertura à tabela carriers
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS coverage_states TEXT[], -- Estados onde a transportadora atua (ex: ['SP','RJ','MG'])
ADD COLUMN IF NOT EXISTS coverage_type TEXT CHECK (coverage_type IN ('estadual', 'regional', 'nacional')), -- Tipo de cobertura
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT ARRAY[]::TEXT[], -- Especialidades (ex: ['refrigerado','perigoso'])
ADD COLUMN IF NOT EXISTS base_rate_per_km NUMERIC(10,2), -- Taxa base por KM (opcional, pode variar por rota)
ADD COLUMN IF NOT EXISTS base_rate_per_kg NUMERIC(10,4); -- Taxa base por KG (opcional)

COMMENT ON COLUMN public.carriers.coverage_states IS 'Estados de atuação da transportadora (array de UFs)';
COMMENT ON COLUMN public.carriers.coverage_type IS 'Tipo de cobertura: estadual (1 estado), regional (vários estados), nacional (todo Brasil)';
COMMENT ON COLUMN public.carriers.specialties IS 'Especialidades de carga: refrigerado, perigoso, frágil, granel, etc.';

-- 2. Modificar carrier_price_table para modelo baseado em Estados + KM
-- Manter compatibilidade com dados antigos, mas adicionar novos campos
ALTER TABLE public.carrier_price_table
ADD COLUMN IF NOT EXISTS origin_state TEXT, -- UF de origem (ex: 'SP')
ADD COLUMN IF NOT EXISTS destination_state TEXT, -- UF de destino (ex: 'RJ')
ADD COLUMN IF NOT EXISTS min_distance_km NUMERIC(10,2), -- Distância mínima em KM
ADD COLUMN IF NOT EXISTS max_distance_km NUMERIC(10,2), -- Distância máxima em KM
ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(10,4), -- Tarifa por KM rodado
ADD COLUMN IF NOT EXISTS fixed_cost NUMERIC(10,2); -- Custo fixo da operação (ex: pedágio, combustível base)

COMMENT ON COLUMN public.carrier_price_table.origin_state IS 'Estado de origem (UF). Mais preciso que region genérica';
COMMENT ON COLUMN public.carrier_price_table.destination_state IS 'Estado de destino (UF)';
COMMENT ON COLUMN public.carrier_price_table.min_distance_km IS 'Distância mínima em KM para esta faixa de preço';
COMMENT ON COLUMN public.carrier_price_table.max_distance_km IS 'Distância máxima em KM para esta faixa de preço';
COMMENT ON COLUMN public.carrier_price_table.rate_per_km IS 'Tarifa por quilômetro rodado (ex: R$ 2.50/km)';
COMMENT ON COLUMN public.carrier_price_table.fixed_cost IS 'Custo fixo da rota (pedágio, combustível base, etc.)';

-- 3. Criar índices para otimizar consultas por estado e distância
CREATE INDEX IF NOT EXISTS idx_carriers_coverage_states ON public.carriers USING GIN (coverage_states);
CREATE INDEX IF NOT EXISTS idx_carrier_prices_states ON public.carrier_price_table (origin_state, destination_state);
CREATE INDEX IF NOT EXISTS idx_carrier_prices_distance ON public.carrier_price_table (min_distance_km, max_distance_km);

-- 4. Atualizar registros antigos para manter compatibilidade
-- Se origin_region parece um CEP (5 dígitos), extrair UF do CEP
-- Se parece um estado (2 letras), usar diretamente
UPDATE public.carrier_price_table
SET origin_state = CASE
  WHEN origin_region ~ '^\d{5}' THEN 
    CASE 
      WHEN origin_region::TEXT LIKE '01%' OR origin_region::TEXT LIKE '05%' THEN 'SP'
      WHEN origin_region::TEXT LIKE '20%' OR origin_region::TEXT LIKE '28%' THEN 'RJ'
      WHEN origin_region::TEXT LIKE '30%' OR origin_region::TEXT LIKE '39%' THEN 'MG'
      WHEN origin_region::TEXT LIKE '40%' THEN 'BA'
      WHEN origin_region::TEXT LIKE '60%' THEN 'CE'
      WHEN origin_region::TEXT LIKE '70%' THEN 'DF'
      WHEN origin_region::TEXT LIKE '80%' THEN 'PR'
      WHEN origin_region::TEXT LIKE '90%' THEN 'RS'
      ELSE NULL
    END
  WHEN origin_region ~ '^[A-Z]{2}$' THEN origin_region
  ELSE NULL
END,
destination_state = CASE
  WHEN destination_region ~ '^\d{5}' THEN 
    CASE 
      WHEN destination_region::TEXT LIKE '01%' OR destination_region::TEXT LIKE '05%' THEN 'SP'
      WHEN destination_region::TEXT LIKE '20%' OR destination_region::TEXT LIKE '28%' THEN 'RJ'
      WHEN destination_region::TEXT LIKE '30%' OR destination_region::TEXT LIKE '39%' THEN 'MG'
      WHEN destination_region::TEXT LIKE '40%' THEN 'BA'
      WHEN destination_region::TEXT LIKE '60%' THEN 'CE'
      WHEN destination_region::TEXT LIKE '70%' THEN 'DF'
      WHEN destination_region::TEXT LIKE '80%' THEN 'PR'
      WHEN destination_region::TEXT LIKE '90%' THEN 'RS'
      ELSE NULL
    END
  WHEN destination_region ~ '^[A-Z]{2}$' THEN destination_region
  ELSE NULL
END
WHERE origin_state IS NULL OR destination_state IS NULL;