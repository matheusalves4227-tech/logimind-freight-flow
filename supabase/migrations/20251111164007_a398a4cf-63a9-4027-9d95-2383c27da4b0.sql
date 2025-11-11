-- ============================================
-- LogiMind KPIs - Views para Métricas de Sucesso
-- ============================================

-- KPI 1: Margem por Tipo de Rota (Rotas de Retorno)
-- Calcula o Take-Rate médio em rotas de retorno (route_adjustment_factor > 0)
-- Meta: 13% a 15% (acima dos 10% padrão)
CREATE OR REPLACE VIEW vw_logimind_kpi_margem_retorno AS
SELECT
  COUNT(*) as total_fretes_retorno,
  SUM(final_price) as gmv_rotas_retorno,
  SUM(comissao_logimarket_val) as comissao_total_retorno,
  CASE 
    WHEN SUM(final_price - comissao_logimarket_val) > 0
    THEN SUM(comissao_logimarket_val)::numeric / SUM(final_price - comissao_logimarket_val)::numeric
    ELSE 0
  END as take_rate_medio_retorno,
  AVG(comissao_logimarket_perc) as comissao_media_perc
FROM orders
WHERE status = 'ENTREGUE'
  AND status_pagamento = 'PAGO'
  AND created_at >= NOW() - INTERVAL '30 days'
  -- Identifica rotas de retorno através de comissão acima de 12% (indicador de subsídio aplicado)
  AND comissao_logimarket_perc > 0.12;

-- KPI 2: Volume vs. Competitividade (Rotas de Alta Demanda)
-- Calcula crescimento de volume em rotas de alta demanda
-- Meta: 15% de crescimento em 6 meses
CREATE OR REPLACE VIEW vw_logimind_kpi_volume_alta_demanda AS
WITH current_period AS (
  SELECT
    COUNT(*) as fretes_atual,
    SUM(final_price) as gmv_atual
  FROM orders
  WHERE status IN ('ENTREGUE', 'EM_TRANSITO', 'AGUARDANDO_COLETA')
    AND created_at >= NOW() - INTERVAL '30 days'
    -- Identifica rotas de alta demanda através de comissão reduzida (5% a 7%)
    AND comissao_logimarket_perc BETWEEN 0.05 AND 0.07
),
previous_period AS (
  SELECT
    COUNT(*) as fretes_anterior,
    SUM(final_price) as gmv_anterior
  FROM orders
  WHERE status IN ('ENTREGUE', 'EM_TRANSITO', 'AGUARDANDO_COLETA')
    AND created_at >= NOW() - INTERVAL '60 days'
    AND created_at < NOW() - INTERVAL '30 days'
    AND comissao_logimarket_perc BETWEEN 0.05 AND 0.07
)
SELECT
  cp.fretes_atual,
  cp.gmv_atual,
  pp.fretes_anterior,
  pp.gmv_anterior,
  CASE 
    WHEN pp.fretes_anterior > 0
    THEN ((cp.fretes_atual - pp.fretes_anterior)::numeric / pp.fretes_anterior::numeric) * 100
    ELSE 0
  END as crescimento_volume_perc,
  CASE 
    WHEN pp.gmv_anterior > 0
    THEN ((cp.gmv_atual - pp.gmv_anterior)::numeric / pp.gmv_anterior::numeric) * 100
    ELSE 0
  END as crescimento_gmv_perc
FROM current_period cp
CROSS JOIN previous_period pp;

-- KPI 3: Adoção e Lucratividade do LogiGuard Pro
-- Calcula ARPF (Average Revenue Per Freight) do LogiGuard Pro
-- Meta: 10% de adesão em fretes com recomendação ativa
-- NOTA: Esta view será populada quando implementarmos o tracking de LogiGuard contratado
-- Por enquanto, retorna estrutura preparada
CREATE OR REPLACE VIEW vw_logimind_kpi_logiguard_pro AS
SELECT
  0::bigint as fretes_com_logiguard,
  0::bigint as fretes_elegiveis_total,
  0::numeric as taxa_adesao_perc,
  0::numeric as receita_total_logiguard,
  0::numeric as arpf_logiguard,
  0::bigint as fretes_alto_risco,
  0::bigint as fretes_alto_valor
-- Esta view será atualizada quando tivermos a tabela de order_add_ons ou similar
-- para rastrear LogiGuard Pro contratado
WHERE FALSE; -- Placeholder até implementação completa

-- View Consolidada: Dashboard LogiMind KPIs
-- Combina os 3 KPIs principais em uma única consulta para dashboard
CREATE OR REPLACE VIEW vw_logimind_dashboard_kpis AS
SELECT
  -- KPI 1: Margem Rotas de Retorno
  (SELECT take_rate_medio_retorno FROM vw_logimind_kpi_margem_retorno) as kpi1_take_rate_retorno,
  (SELECT comissao_media_perc FROM vw_logimind_kpi_margem_retorno) as kpi1_comissao_media,
  (SELECT total_fretes_retorno FROM vw_logimind_kpi_margem_retorno) as kpi1_total_fretes,
  
  -- KPI 2: Volume Alta Demanda
  (SELECT crescimento_volume_perc FROM vw_logimind_kpi_volume_alta_demanda) as kpi2_crescimento_volume,
  (SELECT fretes_atual FROM vw_logimind_kpi_volume_alta_demanda) as kpi2_fretes_atual,
  (SELECT gmv_atual FROM vw_logimind_kpi_volume_alta_demanda) as kpi2_gmv_atual,
  
  -- KPI 3: LogiGuard Pro (placeholder)
  (SELECT taxa_adesao_perc FROM vw_logimind_kpi_logiguard_pro LIMIT 1) as kpi3_taxa_adesao,
  (SELECT arpf_logiguard FROM vw_logimind_kpi_logiguard_pro LIMIT 1) as kpi3_arpf;

COMMENT ON VIEW vw_logimind_kpi_margem_retorno IS 'KPI 1 - Margem por Tipo de Rota: Mede se rotas de retorno estão maximizando margem (meta: 13-15% take-rate)';
COMMENT ON VIEW vw_logimind_kpi_volume_alta_demanda IS 'KPI 2 - Volume vs Competitividade: Mede crescimento em rotas de alta demanda (meta: +15% em 6 meses)';
COMMENT ON VIEW vw_logimind_kpi_logiguard_pro IS 'KPI 3 - Adoção LogiGuard Pro: Mede ARPF e taxa de adesão do serviço (meta: 10% de adesão)';
COMMENT ON VIEW vw_logimind_dashboard_kpis IS 'Dashboard consolidado dos 3 KPIs principais do LogiMind para medição de sucesso';