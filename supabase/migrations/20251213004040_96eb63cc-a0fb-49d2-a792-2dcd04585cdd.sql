-- Adicionar coluna email à tabela profiles para armazenar email do usuário
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar índice para busca por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);