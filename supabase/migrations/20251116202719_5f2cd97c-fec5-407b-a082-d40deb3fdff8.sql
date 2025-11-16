-- Habilitar realtime na tabela orders para atualizações de validação
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;