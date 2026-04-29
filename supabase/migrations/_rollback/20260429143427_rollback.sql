-- BF-36 rollback: restore the pre-hotfix qr_tokens policy verbatim.
--
-- Original policy was created in 20260310163000_qr_tokens.sql with no TO clause
-- (defaults to 'public') and no WITH CHECK. Restored here with the same shape.
-- After running this, BF-31 will need to deal with both flaws (admin gap +
-- public role grant) when it rewrites this table's policies.

DROP POLICY IF EXISTS "Users can manage QR tokens for assigned projects or admin" ON public.qr_tokens;

CREATE POLICY "Users can manage QR tokens for assigned projects"
  ON public.qr_tokens FOR ALL
  USING (
    project_id IN (SELECT project_id FROM public.project_users WHERE user_id = auth.uid())
  );
