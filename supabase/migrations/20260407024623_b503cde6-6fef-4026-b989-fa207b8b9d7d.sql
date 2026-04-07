
-- Create a trigger function that prevents non-admin users from modifying financial fields on orders
CREATE OR REPLACE FUNCTION public.protect_order_financial_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is an admin, allow all changes
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For non-admin users, revert financial/payment fields to their original values
  NEW.status_pagamento := OLD.status_pagamento;
  NEW.paid_at := OLD.paid_at;
  NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
  NEW.stripe_session_id := OLD.stripe_session_id;
  NEW.gateway_transaction_id := OLD.gateway_transaction_id;
  NEW.comissao_logimarket_perc := OLD.comissao_logimarket_perc;
  NEW.comissao_logimarket_val := OLD.comissao_logimarket_val;
  NEW.valor_repasse_liquido := OLD.valor_repasse_liquido;
  NEW.base_price := OLD.base_price;
  NEW.final_price := OLD.final_price;
  NEW.commission_applied := OLD.commission_applied;
  NEW.payment_method := OLD.payment_method;
  NEW.driver_id := OLD.driver_id;
  NEW.driver_name := OLD.driver_name;
  NEW.driver_phone := OLD.driver_phone;
  NEW.status := OLD.status;
  NEW.repasse_data_limite := OLD.repasse_data_limite;

  RETURN NEW;
END;
$$;

-- Attach the trigger to the orders table
DROP TRIGGER IF EXISTS protect_order_financial_fields_trigger ON public.orders;
CREATE TRIGGER protect_order_financial_fields_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_order_financial_fields();
