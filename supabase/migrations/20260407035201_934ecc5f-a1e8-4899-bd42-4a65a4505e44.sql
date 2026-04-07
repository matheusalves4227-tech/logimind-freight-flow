-- Drop the overly permissive public SELECT policy on carriers
DROP POLICY IF EXISTS "Carriers are viewable by everyone" ON public.carriers;

-- Recreate it restricted to authenticated users only
CREATE POLICY "Authenticated users can view active carriers"
ON public.carriers
FOR SELECT
TO authenticated
USING (is_active = true);