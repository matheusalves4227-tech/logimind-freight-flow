-- Make audit_logs append-only to prevent tampering
-- Deny DELETE on audit_logs for all authenticated users
CREATE POLICY "Deny delete on audit logs"
ON public.audit_logs FOR DELETE
TO authenticated USING (false);

-- Deny UPDATE on audit_logs for all authenticated users
CREATE POLICY "Deny update on audit logs"
ON public.audit_logs FOR UPDATE
TO authenticated USING (false);