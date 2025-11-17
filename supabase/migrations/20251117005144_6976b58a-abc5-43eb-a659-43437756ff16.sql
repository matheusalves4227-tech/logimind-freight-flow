-- ============================================================================
-- CORREÇÕES DE SEGURANÇA - PARTE 2: VALIDAÇÕES E FUNÇÕES
-- ============================================================================

-- 1. VALIDAÇÃO: Adicionar constraints de formato e valores
-- ============================================================================

-- Validar formato de CPF (11 dígitos numéricos)
ALTER TABLE public.driver_profiles 
DROP CONSTRAINT IF EXISTS driver_profiles_cpf_format;

ALTER TABLE public.driver_profiles 
ADD CONSTRAINT driver_profiles_cpf_format 
CHECK (cpf ~ '^[0-9]{11}$');

-- Validar formato de CNPJ (14 dígitos numéricos)
ALTER TABLE public.b2b_carriers 
DROP CONSTRAINT IF EXISTS b2b_carriers_cnpj_format;

ALTER TABLE public.b2b_carriers 
ADD CONSTRAINT b2b_carriers_cnpj_format 
CHECK (cnpj ~ '^[0-9]{14}$');

-- Validar formato de CEP (8 dígitos numéricos) - agora vai funcionar após normalização
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_origin_cep_format;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_origin_cep_format 
CHECK (origin_cep ~ '^[0-9]{8}$');

ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_destination_cep_format;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_destination_cep_format 
CHECK (destination_cep ~ '^[0-9]{8}$');

-- Validar valores positivos em campos financeiros
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_positive_prices;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_positive_prices 
CHECK (base_price > 0 AND final_price > 0 AND commission_applied >= 0);

ALTER TABLE public.financial_transactions 
DROP CONSTRAINT IF EXISTS financial_transactions_positive_amount;

ALTER TABLE public.financial_transactions 
ADD CONSTRAINT financial_transactions_positive_amount 
CHECK (amount > 0);

-- Validar ratings entre 1 e 5
ALTER TABLE public.driver_reviews 
DROP CONSTRAINT IF EXISTS driver_reviews_rating_range;

ALTER TABLE public.driver_reviews 
ADD CONSTRAINT driver_reviews_rating_range 
CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE public.carrier_reviews 
DROP CONSTRAINT IF EXISTS carrier_reviews_rating_range;

ALTER TABLE public.carrier_reviews 
ADD CONSTRAINT carrier_reviews_rating_range 
CHECK (rating >= 1 AND rating <= 5);

-- Validar peso e dimensões positivos
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_positive_cargo_dimensions;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_positive_cargo_dimensions 
CHECK (weight_kg > 0);

-- 2. SEGURANÇA: Corrigir todas as funções sem search_path
-- ============================================================================

-- Recriar função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar função auto_generate_codigo_coleta com search_path
CREATE OR REPLACE FUNCTION public.auto_generate_codigo_coleta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só gerar código se o motorista foi atribuído e ainda não tem código
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR NEW.codigo_coleta IS NULL) THEN
    NEW.codigo_coleta := generate_codigo_coleta();
  END IF;
  RETURN NEW;
END;
$$;