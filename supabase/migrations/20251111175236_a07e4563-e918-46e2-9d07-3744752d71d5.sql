-- Fix Security Issues: Remove SECURITY DEFINER from views and fix public exposure

-- 1. Fix SECURITY DEFINER views - recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_logimarket_kpis_current CASCADE;
DROP VIEW IF EXISTS public.vw_logimarket_performance CASCADE;
DROP VIEW IF EXISTS public.vw_logimind_dashboard_kpis CASCADE;
DROP VIEW IF EXISTS public.vw_logimind_kpi_logiguard_pro CASCADE;
DROP VIEW IF EXISTS public.vw_logimind_kpi_margem_retorno CASCADE;
DROP VIEW IF EXISTS public.vw_logimind_kpi_volume_alta_demanda CASCADE;
DROP VIEW IF EXISTS public.vw_pedidos_para_repasse CASCADE;

-- Recreate views with SECURITY INVOKER
CREATE VIEW public.vw_logimarket_kpis_current
WITH (security_invoker = true) AS
SELECT
  COUNT(*) FILTER (WHERE status = 'entregue') AS pedidos_concluidos,
  SUM(final_price) FILTER (WHERE status = 'entregue') AS gmv_total,
  SUM(comissao_logimarket_val) FILTER (WHERE status = 'entregue' AND status_pagamento = 'PAGO') AS faturamento_logimarket,
  SUM(valor_repasse_liquido) FILTER (WHERE status = 'entregue' AND status_pagamento = 'PAGO') AS total_repassado,
  AVG(comissao_logimarket_perc * 100) AS margem_media
FROM public.orders;

CREATE VIEW public.vw_logimarket_performance
WITH (security_invoker = true) AS
SELECT
  DATE_TRUNC('month', created_at) AS month_year,
  COUNT(*) AS total_pedidos,
  SUM(final_price) AS gmv_vendas_brutas,
  SUM(comissao_logimarket_val) AS faturamento_liquido_logimarket,
  SUM(valor_repasse_liquido) AS total_repasse_motorista,
  AVG(comissao_logimarket_perc * 100) AS media_comissao_aplicada
FROM public.orders
WHERE status = 'entregue' AND status_pagamento = 'PAGO'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month_year DESC;

CREATE VIEW public.vw_logimind_dashboard_kpis
WITH (security_invoker = true) AS
SELECT
  COUNT(*) AS kpi1_total_fretes,
  AVG(comissao_logimarket_perc * 100) AS kpi1_comissao_media,
  AVG(comissao_logimarket_perc * 100) FILTER (WHERE service_type = 'FTL') AS kpi1_take_rate_retorno,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS kpi2_fretes_atual,
  SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS kpi2_gmv_atual,
  (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') - 
   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'))::NUMERIC /
   NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'), 0) * 100 AS kpi2_crescimento_volume,
  0 AS kpi3_taxa_adesao,
  0 AS kpi3_arpf
FROM public.orders
WHERE status = 'entregue';

CREATE VIEW public.vw_logimind_kpi_logiguard_pro
WITH (security_invoker = true) AS
SELECT
  0 AS fretes_elegiveis_total,
  0 AS fretes_com_logiguard,
  0 AS taxa_adesao_perc,
  0 AS receita_total_logiguard,
  0 AS arpf_logiguard,
  0 AS fretes_alto_valor,
  0 AS fretes_alto_risco
FROM public.orders
LIMIT 1;

CREATE VIEW public.vw_logimind_kpi_margem_retorno
WITH (security_invoker = true) AS
SELECT
  COUNT(*) FILTER (WHERE service_type = 'FTL') AS total_fretes_retorno,
  SUM(final_price) FILTER (WHERE service_type = 'FTL') AS gmv_rotas_retorno,
  SUM(comissao_logimarket_val) FILTER (WHERE service_type = 'FTL') AS comissao_total_retorno,
  AVG(comissao_logimarket_perc * 100) FILTER (WHERE service_type = 'FTL') AS comissao_media_perc,
  AVG(comissao_logimarket_perc * 100) FILTER (WHERE service_type = 'FTL') AS take_rate_medio_retorno
FROM public.orders
WHERE status = 'entregue';

CREATE VIEW public.vw_logimind_kpi_volume_alta_demanda
WITH (security_invoker = true) AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS fretes_atual,
  SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS gmv_atual,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS fretes_anterior,
  SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') AS gmv_anterior,
  (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') - 
   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'))::NUMERIC /
   NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'), 0) * 100 AS crescimento_volume_perc,
  (SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') - 
   SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'))::NUMERIC /
   NULLIF(SUM(final_price) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'), 0) * 100 AS crescimento_gmv_perc
FROM public.orders;

CREATE VIEW public.vw_pedidos_para_repasse
WITH (security_invoker = true) AS
SELECT
  o.id,
  o.tracking_code,
  o.final_price,
  o.comissao_logimarket_val,
  o.valor_repasse_liquido,
  o.repasse_data_limite,
  o.created_at,
  o.updated_at,
  o.driver_id,
  o.driver_name AS motorista_nome,
  dp.pix_key,
  dp.pix_key_type,
  dp.bank_name,
  dp.bank_account_number,
  dp.id AS driver_profile_id,
  CASE
    WHEN o.repasse_data_limite < NOW() THEN 'VENCIDO'
    WHEN o.repasse_data_limite < NOW() + INTERVAL '24 hours' THEN 'URGENTE'
    ELSE 'NORMAL'
  END AS prioridade
FROM public.orders o
LEFT JOIN public.driver_profiles dp ON o.driver_id = dp.user_id
WHERE o.status = 'entregue'
  AND o.status_pagamento = 'PENDENTE_REPASSE';

-- 2. Fix driver_profiles public exposure - remove ALL admin view policies and recreate correctly
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.driver_profiles;
DROP POLICY IF EXISTS "Admins can view all driver profiles" ON public.driver_profiles;

-- Create secure admin policy that checks role properly
CREATE POLICY "Admins can view all driver profiles"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Grant necessary permissions on views
GRANT SELECT ON public.vw_logimarket_kpis_current TO authenticated;
GRANT SELECT ON public.vw_logimarket_performance TO authenticated;
GRANT SELECT ON public.vw_logimind_dashboard_kpis TO authenticated;
GRANT SELECT ON public.vw_logimind_kpi_logiguard_pro TO authenticated;
GRANT SELECT ON public.vw_logimind_kpi_margem_retorno TO authenticated;
GRANT SELECT ON public.vw_logimind_kpi_volume_alta_demanda TO authenticated;
GRANT SELECT ON public.vw_pedidos_para_repasse TO authenticated;