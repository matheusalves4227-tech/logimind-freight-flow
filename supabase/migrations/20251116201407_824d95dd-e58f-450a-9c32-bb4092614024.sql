-- Criar tabela para cotações B2B recorrentes
CREATE TABLE public.b2b_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Dados da Empresa
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  contato_responsavel TEXT NOT NULL,
  
  -- Volume e Recorrência (Fator de Variação)
  volume_mensal_estimado INTEGER NOT NULL,
  frequencia_envios TEXT NOT NULL CHECK (frequencia_envios IN ('diaria', 'semanal', 'quinzenal', 'mensal')),
  
  -- Rotas e Distância (Fator de Variação)
  rotas_origem TEXT NOT NULL,
  rotas_destino TEXT NOT NULL,
  
  -- Natureza da Carga (Fator de Variação)
  tipo_carga TEXT NOT NULL CHECK (tipo_carga IN ('geral', 'refrigerada', 'perigosa', 'fragil', 'alto_valor')),
  peso_medio_kg NUMERIC NOT NULL,
  valor_medio_carga NUMERIC,
  necessita_seguro BOOLEAN DEFAULT false,
  carga_perigosa BOOLEAN DEFAULT false,
  carga_fragil BOOLEAN DEFAULT false,
  
  -- Prazo de Entrega/SLA (Fator de Variação)
  sla_desejado TEXT NOT NULL CHECK (sla_desejado IN ('same_day', 'express', 'standard', 'economico', 'flexivel')),
  prazo_entrega_dias INTEGER,
  
  -- Otimização de Rota (Fator de Variação - Ociosidade/Rota de Retorno)
  aceita_rota_retorno BOOLEAN DEFAULT false,
  flexibilidade_horario BOOLEAN DEFAULT false,
  
  -- Custos Adicionais (Fator de Variação)
  pedagios_cliente BOOLEAN DEFAULT false,
  armazenagem_cliente BOOLEAN DEFAULT false,
  logistica_reversa BOOLEAN DEFAULT false,
  
  -- Informações Adicionais
  observacoes TEXT,
  
  -- Status da Cotação
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'quoted', 'accepted', 'rejected', 'expired')),
  
  -- Proposta Comercial (preenchido pelo admin)
  proposta_valor_mensal NUMERIC,
  proposta_desconto_percentual NUMERIC,
  proposta_observacoes TEXT,
  proposta_enviada_em TIMESTAMP WITH TIME ZONE,
  proposta_enviada_por UUID,
  
  -- Dados de Contrato (se aceito)
  contrato_data_inicio DATE,
  contrato_data_fim DATE,
  contrato_valor_mensal NUMERIC,
  contrato_aprovado_em TIMESTAMP WITH TIME ZONE,
  contrato_aprovado_por UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_b2b_quotes_user_id ON public.b2b_quotes(user_id);
CREATE INDEX idx_b2b_quotes_status ON public.b2b_quotes(status);
CREATE INDEX idx_b2b_quotes_created_at ON public.b2b_quotes(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.b2b_quotes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários podem ver suas próprias cotações
CREATE POLICY "Users can view their own B2B quotes"
ON public.b2b_quotes
FOR SELECT
USING (auth.uid() = user_id);

-- Políticas RLS: Usuários podem criar suas próprias cotações
CREATE POLICY "Users can create their own B2B quotes"
ON public.b2b_quotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS: Usuários podem atualizar suas próprias cotações pendentes
CREATE POLICY "Users can update their own pending B2B quotes"
ON public.b2b_quotes
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Políticas RLS: Admins podem ver todas as cotações B2B
CREATE POLICY "Admins can view all B2B quotes"
ON public.b2b_quotes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS: Admins podem atualizar todas as cotações B2B
CREATE POLICY "Admins can update all B2B quotes"
ON public.b2b_quotes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_b2b_quotes_updated_at
BEFORE UPDATE ON public.b2b_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.b2b_quotes IS 'Armazena cotações B2B recorrentes com todos os fatores de variação de precificação';
COMMENT ON COLUMN public.b2b_quotes.volume_mensal_estimado IS 'Fator de Variação: Quanto maior o volume, maior o desconto';
COMMENT ON COLUMN public.b2b_quotes.rotas_origem IS 'Fator de Variação: Distância e localização (valor base por km, fator de dificuldade)';
COMMENT ON COLUMN public.b2b_quotes.tipo_carga IS 'Fator de Variação: Natureza da carga (especiais exigem seguro e manuseio diferenciado)';
COMMENT ON COLUMN public.b2b_quotes.sla_desejado IS 'Fator de Variação: Prazo de entrega (express é mais caro que estendido)';
COMMENT ON COLUMN public.b2b_quotes.aceita_rota_retorno IS 'Fator de Variação: Otimização de rota de retorno reduz custo significativamente';
COMMENT ON COLUMN public.b2b_quotes.pedagios_cliente IS 'Fator de Variação: Define quem arca com custos adicionais';