-- Temporariamente desabilitar as constraints de foreign key
ALTER TABLE public.driver_profiles DROP CONSTRAINT IF EXISTS driver_profiles_user_id_fkey;
ALTER TABLE public.driver_profiles DROP CONSTRAINT IF EXISTS driver_profiles_approved_by_fkey;

-- Inserir 3 motoristas de teste
INSERT INTO public.driver_profiles (
  user_id,
  cpf,
  full_name,
  email,
  phone,
  whatsapp,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
  address_cep,
  status,
  approval_notes,
  approved_by,
  approved_at,
  rejected_reason,
  bank_name,
  bank_account_type,
  bank_agency,
  bank_account_number,
  bank_account_digit,
  pix_key,
  pix_key_type
) VALUES
-- Motorista 1: João Victor - APROVADO com dados bancários tradicionais
(
  'e10c735d-a417-48f5-bfb6-b5b9c7b01d33',
  '11122233344',
  'João Victor da Silva',
  'joao.victor@teste.com',
  '+5511987654321',
  '+5511987654321',
  'Rua das Transportadoras',
  '1200',
  'Apto 101',
  'Vila Logística',
  'São Paulo',
  'SP',
  '01234567',
  'approved',
  'Documentos OK, RNTRC validado.',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  NOW(),
  NULL,
  'Banco do Brasil',
  'Corrente',
  '1234',
  '567890',
  '1',
  NULL,
  NULL
),
-- Motorista 2: Maria Eduarda - PENDENTE sem dados bancários (foco Admin)
(
  'b5b9c7b0-1d33-41c9-8d76-1e9a2f4c3b5a',
  '55566677788',
  'Maria Eduarda de Paula',
  'maria.eduarda@teste.com',
  '+5521998765432',
  NULL,
  'Av. dos Pendentes',
  '45-A',
  NULL,
  'Bairro Central',
  'Rio de Janeiro',
  'RJ',
  '20010000',
  'pending',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
),
-- Motorista 3: Carlos Roberto - APROVADO com PIX (teste financeiro)
(
  'd8f2a4e9-6c17-4b92-8a03-7e4f1d2c5b8a',
  '99900011122',
  'Carlos Roberto Logi',
  'carlos.logi@teste.com',
  '+5531976543210',
  '+5531976543210',
  'Rua do Repasse',
  '50',
  'Galpão F',
  'Zona Industrial',
  'Belo Horizonte',
  'MG',
  '30110000',
  'approved',
  'Aprovado para testes financeiros.',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  NOW(),
  NULL,
  'Nubank',
  'Pagamento',
  NULL,
  NULL,
  NULL,
  '99900011122',
  'CPF'
);

-- Re-habilitar as constraints como NOT VALID (não valida registros existentes)
ALTER TABLE public.driver_profiles 
  ADD CONSTRAINT driver_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE 
  NOT VALID;

ALTER TABLE public.driver_profiles 
  ADD CONSTRAINT driver_profiles_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES auth.users(id) 
  NOT VALID;