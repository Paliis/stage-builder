-- Competitor withdraw: DELETE pending (or clear cancelled) instead of keeping a cancelled row.
-- Frees UNIQUE (match_id, competitor_user_id) so re-registration is a plain INSERT (no UPDATE/reopen RLS).

GRANT DELETE ON TABLE public.match_registrations TO authenticated;

DROP POLICY IF EXISTS "match_registrations_delete_competitor_own" ON public.match_registrations;
CREATE POLICY "match_registrations_delete_competitor_own"
  ON public.match_registrations FOR DELETE
  TO authenticated
  USING (
    competitor_user_id = auth.uid()
    AND status IN ('pending', 'cancelled')
    AND confirmed_at IS NULL
    AND confirmed_by IS NULL
  );
