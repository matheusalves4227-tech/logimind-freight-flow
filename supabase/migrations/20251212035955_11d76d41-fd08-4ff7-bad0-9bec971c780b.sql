-- Adiciona policy para admins poderem atualizar pedidos
CREATE POLICY "Admins can update orders" ON public.orders
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));