-- Adicionar campos para validação de motorista na coleta
ALTER TABLE public.orders
ADD COLUMN codigo_coleta TEXT UNIQUE,
ADD COLUMN validado_para_coleta BOOLEAN DEFAULT false,
ADD COLUMN validado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN validado_por_email TEXT,
ADD COLUMN validado_por_nome TEXT;

-- Adicionar campo de foto no perfil do motorista (se não existir)
ALTER TABLE public.driver_profiles
ADD COLUMN foto_perfil_url TEXT;

-- Criar índice para busca rápida por código de coleta
CREATE INDEX idx_orders_codigo_coleta ON public.orders(codigo_coleta) WHERE codigo_coleta IS NOT NULL;

-- Função para gerar código único de coleta (6 dígitos alfanuméricos)
CREATE OR REPLACE FUNCTION generate_codigo_coleta()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Trigger para gerar código de coleta automaticamente quando motorista é atribuído
CREATE OR REPLACE FUNCTION auto_generate_codigo_coleta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só gerar código se o motorista foi atribuído e ainda não tem código
  IF NEW.driver_id IS NOT NULL AND (OLD.driver_id IS NULL OR NEW.codigo_coleta IS NULL) THEN
    NEW.codigo_coleta := generate_codigo_coleta();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_codigo_coleta
BEFORE INSERT OR UPDATE OF driver_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION auto_generate_codigo_coleta();

-- Adicionar política RLS para expedidores validarem motoristas
-- (permitir que usuários autenticados validem coletas de seus próprios pedidos)
CREATE POLICY "Users can validate pickup for their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON COLUMN public.orders.codigo_coleta IS 'Código único de 6 dígitos para validação na coleta';
COMMENT ON COLUMN public.orders.validado_para_coleta IS 'Indica se o motorista foi validado pelo expedidor para coleta';
COMMENT ON COLUMN public.orders.validado_em IS 'Data e hora da validação da coleta';
COMMENT ON COLUMN public.orders.validado_por_email IS 'Email do expedidor que validou a coleta';
COMMENT ON COLUMN public.driver_profiles.foto_perfil_url IS 'URL da foto de perfil do motorista para validação visual';