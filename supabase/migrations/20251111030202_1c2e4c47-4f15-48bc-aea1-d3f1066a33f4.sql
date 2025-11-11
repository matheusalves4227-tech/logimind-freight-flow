-- ====================================
-- INTEGRAÇÃO FINANCEIRA: PAGAMENTO E REPASSE
-- ====================================

-- 1. Adicionar campos financeiros na tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS comissao_logimarket_perc numeric CHECK (comissao_logimarket_perc >= 0 AND comissao_logimarket_perc <= 1),
ADD COLUMN IF NOT EXISTS comissao_logimarket_val numeric,
ADD COLUMN IF NOT EXISTS valor_repasse_liquido numeric,
ADD COLUMN IF NOT EXISTS gateway_transaction_id text,
ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'pending';

-- Comentários para documentação
COMMENT ON COLUMN public.orders.comissao_logimarket_perc IS 'Porcentagem de comissão LogiMarket (0.18 = 18%)';
COMMENT ON COLUMN public.orders.comissao_logimarket_val IS 'Valor absoluto da comissão em R$';
COMMENT ON COLUMN public.orders.valor_repasse_liquido IS 'Valor líquido a repassar ao motorista (Final - Comissão)';
COMMENT ON COLUMN public.orders.gateway_transaction_id IS 'ID da transação no gateway de pagamento';
COMMENT ON COLUMN public.orders.status_pagamento IS 'Status: pending, held, paid, failed, refunded';

-- 2. Criar ENUM para tipo de transação
CREATE TYPE public.transaction_type AS ENUM ('PAYMENT_IN', 'PAYMENT_OUT');

-- 3. Criar ENUM para status de transação
CREATE TYPE public.transaction_status AS ENUM ('PENDING', 'HELD', 'PAID', 'FAILED', 'REFUNDED');

-- 4. Criar tabela financial_transactions
CREATE TABLE public.financial_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  status transaction_status NOT NULL DEFAULT 'PENDING',
  gateway_transaction_id text,
  gateway_response jsonb,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_financial_transactions_order_id ON public.financial_transactions(order_id);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);

-- 5. Habilitar RLS na tabela financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários podem ver transações dos seus próprios pedidos
CREATE POLICY "Users can view their own transactions"
ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = financial_transactions.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Sistema pode inserir transações (via service role ou edge functions)
CREATE POLICY "System can insert transactions"
ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sistema pode atualizar transações
CREATE POLICY "System can update transactions"
ON public.financial_transactions
FOR UPDATE
TO authenticated
USING (true);

-- 6. Trigger para atualizar updated_at em financial_transactions
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Adicionar campo conta bancária na tabela driver_profiles (para repasse)
ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_type text, -- 'corrente' ou 'poupanca'
ADD COLUMN IF NOT EXISTS bank_agency text,
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_account_digit text,
ADD COLUMN IF NOT EXISTS pix_key text,
ADD COLUMN IF NOT EXISTS pix_key_type text; -- 'cpf', 'email', 'phone', 'random'

COMMENT ON COLUMN public.driver_profiles.pix_key IS 'Chave PIX preferencial para repasse';
COMMENT ON COLUMN public.driver_profiles.pix_key_type IS 'Tipo da chave PIX: cpf, email, phone, random';