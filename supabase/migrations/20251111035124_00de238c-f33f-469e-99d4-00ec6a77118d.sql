-- Recriar views com SECURITY INVOKER para usar permissões do usuário atual
DROP VIEW IF EXISTS public.vw_logimarket_performance;
DROP VIEW IF EXISTS public.vw_logimarket_kpis_current;

-- View para dados financeiros de pedidos CONCLUÍDOS e PAGOS
CREATE OR REPLACE VIEW public.vw_logimarket_performance 
WITH (security_invoker = true)
AS
SELECT
    DATE_TRUNC('month', o.created_at) AS month_year,
    COUNT(o.id) AS total_pedidos,
    SUM(o.final_price) AS gmv_vendas_brutas,
    SUM(o.comissao_logimarket_val) AS faturamento_liquido_logimarket,
    SUM(o.valor_repasse_liquido) AS total_repasse_motorista,
    AVG(o.comissao_logimarket_perc) AS media_comissao_aplicada
FROM
    public.orders o
WHERE
    LOWER(o.status) IN ('entregue', 'delivered') 
    AND LOWER(o.status_pagamento) IN ('pago', 'paid')
GROUP BY
    month_year
ORDER BY
    month_year DESC;

-- View simplificada para KPIs do período atual (últimos 30 dias)
CREATE OR REPLACE VIEW public.vw_logimarket_kpis_current
WITH (security_invoker = true)
AS
SELECT
    COUNT(o.id) AS pedidos_concluidos,
    COALESCE(SUM(o.final_price), 0) AS gmv_total,
    COALESCE(SUM(o.comissao_logimarket_val), 0) AS faturamento_logimarket,
    COALESCE(AVG(o.comissao_logimarket_perc), 0) AS margem_media,
    COALESCE(SUM(o.valor_repasse_liquido), 0) AS total_repassado
FROM
    public.orders o
WHERE
    LOWER(o.status) IN ('entregue', 'delivered')
    AND LOWER(o.status_pagamento) IN ('pago', 'paid')
    AND o.created_at >= NOW() - INTERVAL '30 days';