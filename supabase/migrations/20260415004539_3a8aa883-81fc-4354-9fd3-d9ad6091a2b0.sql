-- Update the trigger function to also create a driver notification
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
  v_driver_user_id UUID;
  v_formatted_amount TEXT;
BEGIN
  -- Only trigger when status changes TO 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.driver_id IS NOT NULL THEN
    
    -- Check if payout already exists for this order
    SELECT id INTO v_existing FROM public.payouts_queue WHERE order_id = NEW.id;
    IF v_existing IS NOT NULL THEN
      RETURN NEW;
    END IF;

    -- Calculate fees using "All-Inclusive" model
    v_stripe_fee := ROUND(NEW.final_price * 0.0399, 2);
    v_commission_rate := COALESCE(NEW.comissao_logimarket_perc, 15) / 100.0;
    v_platform_fee := ROUND(NEW.final_price * v_commission_rate - v_stripe_fee, 2);
    IF v_platform_fee < 0 THEN
      v_platform_fee := 0;
    END IF;
    v_payout_amount := ROUND(NEW.final_price - v_stripe_fee - v_platform_fee, 2);

    INSERT INTO public.payouts_queue (
      order_id, driver_id, gross_amount, stripe_fee, platform_net_fee, payout_amount, status
    ) VALUES (
      NEW.id, NEW.driver_id, NEW.final_price, v_stripe_fee, v_platform_fee, v_payout_amount, 'pending'
    );

    -- Update order financial fields if not already set
    IF NEW.valor_repasse_liquido IS NULL THEN
      NEW.comissao_logimarket_perc := COALESCE(NEW.comissao_logimarket_perc, 15);
      NEW.comissao_logimarket_val := v_stripe_fee + v_platform_fee;
      NEW.valor_repasse_liquido := v_payout_amount;
      NEW.repasse_data_limite := now() + interval '3 days';
      NEW.status_pagamento := 'pendente_repasse';
    END IF;

    -- Get driver user_id for notification
    SELECT user_id INTO v_driver_user_id FROM public.driver_profiles WHERE id = NEW.driver_id;

    IF v_driver_user_id IS NOT NULL THEN
      v_formatted_amount := 'R$ ' || TRIM(TO_CHAR(v_payout_amount, '999G999D99'));

      INSERT INTO public.driver_notifications (
        driver_user_id, title, body, type, metadata
      ) VALUES (
        v_driver_user_id,
        'Entrega confirmada! 🎉',
        'Seu repasse de ' || v_formatted_amount || ' foi processado e está agendado para cair na sua conta em breve.',
        'payout',
        jsonb_build_object(
          'order_id', NEW.id,
          'tracking_code', NEW.tracking_code,
          'payout_amount', v_payout_amount
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;