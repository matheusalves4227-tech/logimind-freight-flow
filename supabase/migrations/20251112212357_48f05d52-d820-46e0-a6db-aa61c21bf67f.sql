-- Add policy to allow admins to insert driver profiles
CREATE POLICY "Admins can insert driver profiles"
ON public.driver_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));