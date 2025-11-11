-- ====================================
-- SISTEMA DE ROLES E GESTÃO DE MOTORISTAS
-- ====================================

-- 1. Criar ENUM para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'user');

-- 2. Criar tabela user_roles (CRÍTICO: Roles NUNCA devem estar na tabela de profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Comentários
COMMENT ON TABLE public.user_roles IS 'Armazena roles dos usuários separadamente por segurança - previne privilege escalation';
COMMENT ON COLUMN public.user_roles.role IS 'Role do usuário: admin (gestão), driver (motorista), user (embarcador)';

-- Índices para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 3. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função SECURITY DEFINER para verificar roles (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Verifica se usuário tem um role específico - usa SECURITY DEFINER para evitar recursão RLS';

-- 5. Políticas RLS para user_roles
-- Admins podem ver todos os roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver seus próprios roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Apenas admins podem inserir/atualizar roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Atualizar RLS de driver_profiles para permitir admins verem todos
CREATE POLICY "Admins can view all driver profiles"
ON public.driver_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem aprovar/rejeitar motoristas
CREATE POLICY "Admins can update driver profiles"
ON public.driver_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admins podem ver todos os documentos de motoristas
CREATE POLICY "Admins can view all driver documents"
ON public.driver_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Admins podem ver todos os veículos
CREATE POLICY "Admins can view all driver vehicles"
ON public.driver_vehicles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Política de Storage para admins acessarem documentos
CREATE POLICY "Admins can view all driver documents in storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-documents' 
  AND public.has_role(auth.uid(), 'admin')
);