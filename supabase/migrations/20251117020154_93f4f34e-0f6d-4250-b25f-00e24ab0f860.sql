-- Criar tabela de auditoria para compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem visualizar logs de auditoria
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Política: Sistema pode inserir logs (via edge functions com service_role)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Criar índices para otimizar consultas
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.audit_logs IS 'Tabela de auditoria para compliance e rastreamento de ações críticas';
COMMENT ON COLUMN public.audit_logs.action IS 'Tipo de ação auditada (ex: account_deletion, data_export, etc)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'Endereço IP do usuário no momento da ação';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent do navegador/dispositivo';
COMMENT ON COLUMN public.audit_logs.reason IS 'Motivo fornecido pelo usuário para a ação';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Dados adicionais em formato JSON para contexto completo';