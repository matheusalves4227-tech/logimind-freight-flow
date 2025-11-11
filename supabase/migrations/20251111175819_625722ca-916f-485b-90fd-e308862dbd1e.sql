-- Security Fix: Restrict access to business KPI views to admins only
-- Since views don't support RLS directly, we create security definer functions
-- that wrap the views and check admin role before returning data

-- Function to safely access financial KPIs (admin only)
CREATE OR REPLACE FUNCTION public.get_logimarket_kpis_current()
RETURNS TABLE (
  pedidos_concluidos bigint,
  gmv_total numeric,
  faturamento_logimarket numeric,
  total_repassado numeric,
  margem_media numeric
)
SECURITY DEFINER
SET search_path TO 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only admins can access business KPIs
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required to view business KPIs';
  END IF;
  
  RETURN QUERY SELECT * FROM public.vw_logimarket_kpis_current;
END;
$$;

-- Function to safely access performance metrics (admin only)
CREATE OR REPLACE FUNCTION public.get_logimarket_performance()
RETURNS TABLE (
  month_year timestamp with time zone,
  total_pedidos bigint,
  gmv_vendas_brutas numeric,
  faturamento_liquido_logimarket numeric,
  total_repasse_motorista numeric,
  media_comissao_aplicada numeric
)
SECURITY DEFINER
SET search_path TO 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.vw_logimarket_performance;
END;
$$;

-- Function to safely access LogiMind dashboard KPIs (admin only)
CREATE OR REPLACE FUNCTION public.get_logimind_dashboard_kpis()
RETURNS TABLE (
  kpi1_total_fretes bigint,
  kpi1_comissao_media numeric,
  kpi1_take_rate_retorno numeric,
  kpi2_fretes_atual bigint,
  kpi2_gmv_atual numeric,
  kpi2_crescimento_volume numeric,
  kpi3_taxa_adesao numeric,
  kpi3_arpf numeric
)
SECURITY DEFINER
SET search_path TO 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.vw_logimind_dashboard_kpis;
END;
$$;

-- Function to safely access pending payouts (admin only)
CREATE OR REPLACE FUNCTION public.get_pedidos_para_repasse()
RETURNS TABLE (
  id uuid,
  tracking_code text,
  final_price numeric,
  comissao_logimarket_val numeric,
  valor_repasse_liquido numeric,
  repasse_data_limite timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  driver_id uuid,
  motorista_nome text,
  pix_key text,
  pix_key_type text,
  bank_name text,
  bank_account_number text,
  driver_profile_id uuid,
  prioridade text
)
SECURITY DEFINER
SET search_path TO 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Only financial admins can access payout queue';
  END IF;
  
  RETURN QUERY SELECT * FROM public.vw_pedidos_para_repasse;
END;
$$;

-- Revoke direct access to views from public/authenticated
REVOKE ALL ON public.vw_logimarket_kpis_current FROM authenticated;
REVOKE ALL ON public.vw_logimarket_performance FROM authenticated;
REVOKE ALL ON public.vw_logimind_dashboard_kpis FROM authenticated;
REVOKE ALL ON public.vw_pedidos_para_repasse FROM authenticated;

-- Grant execute on functions to authenticated users (auth check happens inside)
GRANT EXECUTE ON FUNCTION public.get_logimarket_kpis_current() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_logimarket_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_logimind_dashboard_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pedidos_para_repasse() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_logimarket_kpis_current IS 'Admin-only: Returns current business KPIs including revenue and margins';
COMMENT ON FUNCTION public.get_logimarket_performance IS 'Admin-only: Returns historical performance metrics by month';
COMMENT ON FUNCTION public.get_logimind_dashboard_kpis IS 'Admin-only: Returns LogiMind pricing engine performance metrics';
COMMENT ON FUNCTION public.get_pedidos_para_repasse IS 'Admin-only: Returns queue of pending driver payouts with sensitive bank data';