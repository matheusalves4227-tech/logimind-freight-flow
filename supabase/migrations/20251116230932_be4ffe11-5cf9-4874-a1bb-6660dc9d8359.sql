-- Habilitar realtime para as tabelas de tracking e orders
-- Configura REPLICA IDENTITY FULL para capturar todos os dados das mudanças
ALTER TABLE public.tracking_events REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Adiciona tracking_events à publicação do realtime (orders já está)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'tracking_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;
  END IF;
END $$;