-- Adicionar campos de contato comercial na tabela carriers
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_whatsapp text,
ADD COLUMN IF NOT EXISTS commercial_notes text;

COMMENT ON COLUMN public.carriers.contact_name IS 'Nome do contato comercial da transportadora';
COMMENT ON COLUMN public.carriers.contact_phone IS 'Telefone comercial da transportadora';
COMMENT ON COLUMN public.carriers.contact_email IS 'Email comercial da transportadora';
COMMENT ON COLUMN public.carriers.contact_whatsapp IS 'WhatsApp comercial da transportadora';
COMMENT ON COLUMN public.carriers.commercial_notes IS 'Notas sobre negociações e parcerias com a transportadora';

-- Adicionar campo de notas de operação manual nos pedidos
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS operational_notes text;

COMMENT ON COLUMN public.orders.operational_notes IS 'Notas do admin sobre contatos e negociações manuais com a transportadora';