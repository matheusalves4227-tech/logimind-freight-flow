
-- 1. Corrigir política de INSERT em audit_logs (deve ser apenas para usuários autenticados)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Corrigir políticas em financial_transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.financial_transactions;
DROP POLICY IF EXISTS "System can update transactions" ON public.financial_transactions;

-- Permitir inserção apenas para o dono do pedido ou admins
CREATE POLICY "Users can insert own transactions"
ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id 
    AND orders.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Permitir atualização apenas para admins
CREATE POLICY "Admins can update transactions"
ON public.financial_transactions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Corrigir política em tracking_events (deve ser restrita)
DROP POLICY IF EXISTS "System can insert tracking events" ON public.tracking_events;

-- Permitir inserção de eventos de tracking por donos do pedido, drivers atribuídos ou admins
CREATE POLICY "Users can insert tracking events for their orders"
ON public.tracking_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_id 
    AND (
      orders.user_id = auth.uid()
      OR orders.driver_id IN (SELECT id FROM public.driver_profiles WHERE user_id = auth.uid())
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. Manter rate_limits apenas para service_role (isso é seguro, mas vamos ser explícitos)
-- A política atual para service_role é aceitável pois service_role tem privilégios elevados
-- Mas podemos deixar mais explícito removendo e recriando
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Criar política apenas para service_role que é segura por design
CREATE POLICY "Only service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
