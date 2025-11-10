-- Adicionar colunas de porte e especialidade às transportadoras
ALTER TABLE public.carriers 
ADD COLUMN carrier_size text CHECK (carrier_size IN ('small', 'medium', 'large')),
ADD COLUMN specialties text[] DEFAULT ARRAY[]::text[];

-- Atualizar transportadoras existentes com dados exemplo
UPDATE public.carriers SET carrier_size = 'large', specialties = ARRAY['Carga Seca', 'Fracionada'] WHERE name = 'Express Log';
UPDATE public.carriers SET carrier_size = 'medium', specialties = ARRAY['Entregas Rápidas', 'Urbano'] WHERE name = 'Rápido Trans';
UPDATE public.carriers SET carrier_size = 'small', specialties = ARRAY['Econômico', 'Regional'] WHERE name = 'EconoFrete';