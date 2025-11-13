-- Adicionar campos de pagamento Stripe na tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Atualizar status_pagamento com novos valores
COMMENT ON COLUMN public.orders.status_pagamento IS 'Status do pagamento: pending (aguardando), processing (processando), paid (pago), failed (falhou), refunded (reembolsado)';

-- Criar índice para busca rápida por sessão Stripe
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON public.orders(stripe_payment_intent_id);