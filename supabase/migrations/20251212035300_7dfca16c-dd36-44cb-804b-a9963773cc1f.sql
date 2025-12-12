-- Add INSERT policy for admins on carriers table
CREATE POLICY "Admins can insert carriers"
ON public.carriers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy for admins on carriers table
CREATE POLICY "Admins can update carriers"
ON public.carriers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins on carriers table
CREATE POLICY "Admins can delete carriers"
ON public.carriers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));