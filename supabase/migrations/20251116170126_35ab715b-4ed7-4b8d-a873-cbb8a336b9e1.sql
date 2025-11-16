-- Criar tabela para transportadoras B2B
CREATE TABLE IF NOT EXISTS public.b2b_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da empresa
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  whatsapp TEXT,
  
  -- Endereço
  address_cep TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state TEXT NOT NULL,
  
  -- Capacidade operacional
  fleet_size INTEGER,
  coverage_regions TEXT[],
  vehicle_types TEXT[],
  avg_monthly_capacity INTEGER,
  
  -- Status e aprovação
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approval_notes TEXT,
  rejected_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- Habilitar RLS
ALTER TABLE public.b2b_carriers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para transportadoras B2B
CREATE POLICY "Carriers can view their own profile"
  ON public.b2b_carriers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Carriers can create their own profile"
  ON public.b2b_carriers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Carriers can update their own pending profile"
  ON public.b2b_carriers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all carrier profiles"
  ON public.b2b_carriers
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carrier profiles"
  ON public.b2b_carriers
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_b2b_carriers_updated_at
  BEFORE UPDATE ON public.b2b_carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_b2b_carriers_user_id ON public.b2b_carriers(user_id);
CREATE INDEX idx_b2b_carriers_status ON public.b2b_carriers(status);
CREATE INDEX idx_b2b_carriers_cnpj ON public.b2b_carriers(cnpj);