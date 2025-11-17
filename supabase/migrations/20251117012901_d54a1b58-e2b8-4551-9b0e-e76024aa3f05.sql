-- Corrigir search_path nas funções auxiliares

-- 1. Função para gerar código de coleta
CREATE OR REPLACE FUNCTION public.generate_codigo_coleta()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres (letras maiúsculas e números)
    codigo := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    
    -- Verificar se o código já existe
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE codigo_coleta = codigo) INTO existe;
    
    -- Se não existe, retornar o código
    IF NOT existe THEN
      RETURN codigo;
    END IF;
  END LOOP;
END;
$$;

-- 2. Trigger function para gerar código automaticamente
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

-- 3. Função para atualizar updated_at automaticamente
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