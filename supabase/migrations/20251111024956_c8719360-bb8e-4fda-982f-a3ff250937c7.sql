-- Criar tabela de lances dos motoristas autônomos
CREATE TABLE IF NOT EXISTS public.driver_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_profile_id UUID NOT NULL REFERENCES public.driver_profiles(id),
  opportunity_id TEXT NOT NULL,
  bid_price NUMERIC NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_bids ENABLE ROW LEVEL SECURITY;

-- Policies para motoristas verem seus próprios lances
CREATE POLICY "Drivers can view their own bids"
ON public.driver_bids
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM driver_profiles
    WHERE driver_profiles.id = driver_bids.driver_profile_id
    AND driver_profiles.user_id = auth.uid()
  )
);

-- Políticas para motoristas criarem lances
CREATE POLICY "Drivers can create their own bids"
ON public.driver_bids
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM driver_profiles
    WHERE driver_profiles.id = driver_bids.driver_profile_id
    AND driver_profiles.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_driver_bids_updated_at
BEFORE UPDATE ON public.driver_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();