-- Participant (shooter): optional default division / class / PF for new match registrations.
-- Saved from account page; read when opening the public match registration form.

CREATE TABLE IF NOT EXISTS public.participant_registration_defaults (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  division TEXT NOT NULL DEFAULT '',
  classification_grade TEXT NOT NULL DEFAULT '',
  power_factor TEXT CHECK (power_factor IS NULL OR upper(trim(power_factor)) IN ('MAJOR', 'MINOR')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.participant_registration_defaults IS
  'Shooter default registration fields; UI prefill on published match signup.';

ALTER TABLE public.participant_registration_defaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participant_registration_defaults_select_own" ON public.participant_registration_defaults;
CREATE POLICY "participant_registration_defaults_select_own"
  ON public.participant_registration_defaults FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "participant_registration_defaults_insert_own" ON public.participant_registration_defaults;
CREATE POLICY "participant_registration_defaults_insert_own"
  ON public.participant_registration_defaults FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participant_registration_defaults_update_own" ON public.participant_registration_defaults;
CREATE POLICY "participant_registration_defaults_update_own"
  ON public.participant_registration_defaults FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "participant_registration_defaults_delete_own" ON public.participant_registration_defaults;
CREATE POLICY "participant_registration_defaults_delete_own"
  ON public.participant_registration_defaults FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.participant_registration_defaults TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.participant_registration_defaults TO service_role;

DROP TRIGGER IF EXISTS trg_participant_registration_defaults_updated_at ON public.participant_registration_defaults;
CREATE TRIGGER trg_participant_registration_defaults_updated_at
  BEFORE UPDATE ON public.participant_registration_defaults
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();
