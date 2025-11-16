-- Habilitar realtime para a tabela driver_documents
ALTER TABLE public.driver_documents REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_documents;