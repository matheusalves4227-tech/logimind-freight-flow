-- Adicionar campo driver_id na tabela orders caso não exista
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN driver_id uuid REFERENCES public.driver_profiles(id);
    END IF;
END $$;

-- Adicionar campo repasse_data_limite
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS repasse_data_limite timestamp with time zone;

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_orders_status_pagamento ON public.orders(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);

-- View para pedidos pendentes de repasse
CREATE OR REPLACE VIEW public.vw_pedidos_para_repasse
WITH (security_invoker = true)
AS
SELECT
    o.id,
    o.tracking_code,
    o.final_price,
    o.comissao_logimarket_val,
    o.valor_repasse_liquido,
    o.repasse_data_limite,
    o.created_at,
    o.updated_at,
    dp.id as driver_profile_id,
    dp.full_name AS motorista_nome,
    dp.pix_key_type,
    dp.pix_key,
    dp.bank_name,
    dp.bank_account_number,
    CASE 
        WHEN o.repasse_data_limite < NOW() THEN 'vencido'
        WHEN o.repasse_data_limite < NOW() + INTERVAL '1 day' THEN 'urgente'
        ELSE 'normal'
    END as prioridade
FROM
    public.orders o
LEFT JOIN
    public.driver_profiles dp ON o.driver_id = dp.id
WHERE
    LOWER(o.status) IN ('entregue', 'delivered')
    AND LOWER(o.status_pagamento) = 'pendente_repasse'
ORDER BY
    o.repasse_data_limite ASC NULLS LAST;