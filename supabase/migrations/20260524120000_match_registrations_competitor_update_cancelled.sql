-- Allow competitors to reopen a cancelled registration (same row) instead of violating UNIQUE (match_id, competitor_user_id).

DROP POLICY IF EXISTS "match_registrations_update_competitor" ON public.match_registrations;

CREATE POLICY "match_registrations_update_competitor"
  ON public.match_registrations FOR UPDATE
  TO authenticated
  USING (
    competitor_user_id = auth.uid()
    AND status IN ('pending', 'cancelled')
  )
  WITH CHECK (
    competitor_user_id = auth.uid()
    AND status IN ('pending', 'cancelled')
    AND confirmed_at IS NULL
    AND confirmed_by IS NULL
  );
