-- 1. Create enum for payout status
CREATE TYPE public.payout_status AS ENUM ('pending', 'ready_for_transfer', 'paid', 'failed');

-- 2. Create payouts_queue table
CREATE TABLE public.payouts_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE RESTRICT,
  driver_id UUID NOT NULL REFERENCES public.driver_profiles(id) ON DELETE RESTRICT,
  gross_amount NUMERIC NOT NULL,
  stripe_fee NUMERIC NOT NULL DEFAULT 0,
  platform_net_fee NUMERIC NOT NULL DEFAULT 0,
  payout_amount NUMERIC NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Performance indexes
CREATE INDEX idx_payouts_ready_transfer 
ON public.payouts_queue (status) 
WHERE status = 'ready_for_transfer';

CREATE INDEX idx_payouts_driver_history 
ON public.payouts_queue (driver_id, created_at DESC);

CREATE INDEX idx_payouts_scheduled 
ON public.payouts_queue (scheduled_for ASC) 
WHERE status = 'pending';

-- 4. Enable RLS
ALTER TABLE public.payouts_queue ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all payouts"
ON public.payouts_queue FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payouts"
ON public.payouts_queue FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payouts"
ON public.payouts_queue FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Driver policy: can only see their own payouts
CREATE POLICY "Drivers can view their own payouts"
ON public.payouts_queue FOR SELECT
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM public.driver_profiles WHERE user_id = auth.uid()
  )
);

-- Service role full access (for triggers/functions)
CREATE POLICY "Service role full access"
ON public.payouts_queue FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Auto-update updated_at
CREATE TRIGGER update_payouts_queue_updated_at
BEFORE UPDATE ON public.payouts_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Trigger: auto-create payout when order is delivered
CREATE OR REPLACE FUNCTION public.auto_create_payout_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_stripe_fee NUMERIC;
  v_platform_fee NUMERIC;
  v_payout_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_existing UUID;
BEGIN
  -- Only trigger when status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.driver_id IS NOT NULL THEN
    
    -- Check if payout already exists for this order
    SELECT id INTO v_existing FROM public.payouts_queue WHERE order_id = NEW.id;
    IF v_existing IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate fees using "All-Inclusive" model
    -- Stripe fee: ~3.99% of gross
    v_stripe_fee := ROUND(NEW.final_price * 0.0399, 2);
    
    -- Platform commission rate (default 15%)
    v_commission_rate := COALESCE(NEW.comissao_logimarket_perc, 15) / 100.0;
    
    -- Platform net fee = gross * commission_rate - stripe_fee
    v_platform_fee := ROUND(NEW.final_price * v_commission_rate - v_stripe_fee, 2);
    IF v_platform_fee < 0 THEN
      v_platform_fee := 0;
    END IF;
    
    -- Payout = gross - stripe_fee - platform_fee
    v_payout_amount := ROUND(NEW.final_price - v_stripe_fee - v_platform_fee, 2);

    INSERT INTO public.payouts_queue (
      order_id, driver_id, gross_amount, stripe_fee, platform_net_fee, payout_amount, status
    ) VALUES (
      NEW.id, NEW.driver_id, NEW.final_price, v_stripe_fee, v_platform_fee, v_payout_amount, 'pending'
    );

    -- Also update order financial fields if not already set
    IF NEW.valor_repasse_liquido IS NULL THEN
      NEW.comissao_logimarket_perc := COALESCE(NEW.comissao_logimarket_perc, 15);
      NEW.comissao_logimarket_val := v_stripe_fee + v_platform_fee;
      NEW.valor_repasse_liquido := v_payout_amount;
      NEW.repasse_data_limite := now() + interval '3 days';
      NEW.status_pagamento := 'pendente_repasse';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_payout_on_delivery
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_payout_on_delivery();

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts_queue;