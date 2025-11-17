-- =====================================================
-- CORREÇÃO DE SEGURANÇA - Políticas Faltantes (Versão Corrigida)
-- Fixing remaining security issues from security scan
-- =====================================================

-- ============ b2b_carriers - Adicionar apenas política faltante ============
CREATE POLICY "Admins can insert carrier profiles"
ON public.b2b_carriers FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ b2b_quotes - Adicionar políticas faltantes ============
CREATE POLICY "Admins can update b2b quotes"
ON public.b2b_quotes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ driver_cnh_data - Adicionar política de admin ============
CREATE POLICY "Admins can view all CNH data"
ON public.driver_cnh_data FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ driver_bids - Adicionar política de admin ============
CREATE POLICY "Admins can view all driver bids"
ON public.driver_bids FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============ carrier_performance_scores - Corrigir políticas existentes ============
DROP POLICY IF EXISTS "Scores de transportadoras são públicos" ON public.carrier_performance_scores;
DROP POLICY IF EXISTS "Sistema atualiza scores de transportadoras" ON public.carrier_performance_scores;
DROP POLICY IF EXISTS "Sistema modifica scores de transportadoras" ON public.carrier_performance_scores;

CREATE POLICY "Anyone can view carrier performance scores"
ON public.carrier_performance_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can update carrier performance scores"
ON public.carrier_performance_scores FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert carrier performance scores"
ON public.carrier_performance_scores FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ driver_performance_scores - Corrigir políticas existentes ============
DROP POLICY IF EXISTS "Performance scores são públicas" ON public.driver_performance_scores;
DROP POLICY IF EXISTS "Apenas sistema pode atualizar scores" ON public.driver_performance_scores;
DROP POLICY IF EXISTS "Apenas sistema pode modificar scores" ON public.driver_performance_scores;

CREATE POLICY "Anyone can view driver performance scores"
ON public.driver_performance_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can update driver performance scores"
ON public.driver_performance_scores FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert driver performance scores"
ON public.driver_performance_scores FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ carrier_reviews - Corrigir políticas existentes ============
DROP POLICY IF EXISTS "Reviews de transportadoras são públicas" ON public.carrier_reviews;
DROP POLICY IF EXISTS "Usuários podem criar reviews de suas transportadoras" ON public.carrier_reviews;
DROP POLICY IF EXISTS "Usuários podem atualizar reviews de transportadoras" ON public.carrier_reviews;

CREATE POLICY "Anyone can view carrier reviews"
ON public.carrier_reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create reviews for their orders"
ON public.carrier_reviews FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reviews"
ON public.carrier_reviews FOR UPDATE
TO authenticated
USING (reviewer_user_id = auth.uid());

-- ============ driver_reviews - Corrigir políticas existentes ============
DROP POLICY IF EXISTS "Reviews são públicas para leitura" ON public.driver_reviews;
DROP POLICY IF EXISTS "Usuários podem criar reviews de seus próprios pedidos" ON public.driver_reviews;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios reviews" ON public.driver_reviews;

CREATE POLICY "Anyone can view driver reviews"
ON public.driver_reviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create driver reviews for their orders"
ON public.driver_reviews FOR INSERT
TO authenticated
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own driver reviews"
ON public.driver_reviews FOR UPDATE
TO authenticated
USING (reviewer_user_id = auth.uid());

-- ============ UPDATE has_role FUNCTION WITH search_path (sem dropar) ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;