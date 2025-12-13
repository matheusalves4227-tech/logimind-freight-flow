-- Create shipper_profiles table for shipper/company registration
CREATE TABLE public.shipper_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cnpj TEXT NOT NULL,
  razao_social TEXT,
  company_sector TEXT NOT NULL,
  monthly_freight_volume TEXT NOT NULL,
  corporate_email TEXT NOT NULL,
  responsible_name TEXT NOT NULL,
  responsible_cpf TEXT NOT NULL,
  phone TEXT NOT NULL,
  accepts_whatsapp_contact BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shipper_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Shippers can view their own profile"
ON public.shipper_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Shippers can create their own profile"
ON public.shipper_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shippers can update their own pending profile"
ON public.shipper_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all shipper profiles"
ON public.shipper_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shipper profiles"
ON public.shipper_profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_shipper_profiles_updated_at
BEFORE UPDATE ON public.shipper_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();