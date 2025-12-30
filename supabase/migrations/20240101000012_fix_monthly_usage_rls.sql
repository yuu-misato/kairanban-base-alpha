-- Fix RLS policy for user_monthly_usages
-- "Service can manage usage" was too permissive (allow all).
-- Edge Functions use service_role key which bypasses RLS, so we don't need a policy for it.
-- We need a policy for Admins to view/manage usages.

DROP POLICY IF EXISTS "Service can manage usage" ON public.user_monthly_usages;

CREATE POLICY "Admins can manage all usages"
  ON public.user_monthly_usages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
