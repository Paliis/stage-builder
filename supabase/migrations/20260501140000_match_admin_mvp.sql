-- Match admin MVP: registration + squads + links to shared stages (BL-025 area)
-- Discipline MVP: shotgun only — see docs/MATCH_REGISTRATION_AND_PSC_PLAN.md §1.3
-- Apply in Supabase: SQL Editor → Run (same workflow as SHARED_STAGES)

-- -----------------------------------------------------------------------------
-- Display names (avoid name collision with boilerplate `public.profiles`)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.match_admin_profiles IS 'Optional UI name for portal/match flows; unrelated to Stage Builder scenes.';

CREATE INDEX IF NOT EXISTS idx_match_admin_profiles_created_at ON public.match_admin_profiles (created_at);

ALTER TABLE public.match_admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_admin_profiles_select_own" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_select_own"
  ON public.match_admin_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "match_admin_profiles_insert_own" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_insert_own"
  ON public.match_admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "match_admin_profiles_update_own" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_update_own"
  ON public.match_admin_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON TABLE public.match_admin_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_admin_profiles TO service_role;

-- -----------------------------------------------------------------------------
-- Matches
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description_md TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  location_label TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  competitor_limit INTEGER NOT NULL CHECK (competitor_limit > 0),
  discipline TEXT NOT NULL DEFAULT 'shotgun' CHECK (discipline = 'shotgun'),
  ps_match_type TEXT,
  ps_match_subtype TEXT DEFAULT 'ipsc',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  schema_version SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.matches IS 'Shooting match; MVP discipline shotgun only (IPSC shotgun PSC preset).';

CREATE INDEX IF NOT EXISTS idx_matches_organizer_id ON public.matches (organizer_id);
CREATE INDEX IF NOT EXISTS idx_matches_status_starts ON public.matches (status, starts_at);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_select_visible" ON public.matches;
CREATE POLICY "matches_select_visible"
  ON public.matches FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR organizer_id = auth.uid()
  );

DROP POLICY IF EXISTS "matches_insert_organizer" ON public.matches;
CREATE POLICY "matches_insert_organizer"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS "matches_update_organizer" ON public.matches;
CREATE POLICY "matches_update_organizer"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS "matches_delete_organizer" ON public.matches;
CREATE POLICY "matches_delete_organizer"
  ON public.matches FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid());

GRANT SELECT ON TABLE public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.matches TO service_role;

-- -----------------------------------------------------------------------------
-- Squads (per match)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  squad_starts_at TIMESTAMPTZ,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, sort_order)
);

COMMENT ON TABLE public.match_squads IS 'Squads / slots linked to one match; capacity enforced in application for MVP.';

CREATE INDEX IF NOT EXISTS idx_match_squads_match_id ON public.match_squads (match_id);

ALTER TABLE public.match_squads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_squads_select_visible" ON public.match_squads;
CREATE POLICY "match_squads_select_visible"
  ON public.match_squads FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND (
          m.status = 'published'
          OR m.organizer_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "match_squads_write_organizer" ON public.match_squads;
CREATE POLICY "match_squads_write_organizer"
  ON public.match_squads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_squads_update_organizer" ON public.match_squads;
CREATE POLICY "match_squads_update_organizer"
  ON public.match_squads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_squads_delete_organizer" ON public.match_squads;
CREATE POLICY "match_squads_delete_organizer"
  ON public.match_squads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

GRANT SELECT ON TABLE public.match_squads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_squads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_squads TO service_role;

-- -----------------------------------------------------------------------------
-- Registrations (one row per competitor per match)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  squad_id UUID NOT NULL REFERENCES public.match_squads (id) ON DELETE RESTRICT,
  competitor_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  division TEXT NOT NULL DEFAULT '',
  classification_grade TEXT NOT NULL DEFAULT '',
  power_factor TEXT CHECK (power_factor IS NULL OR upper(power_factor) IN ('MAJOR', 'MINOR')),
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_note TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, competitor_user_id),
  CONSTRAINT match_registrations_confirmed_pair CHECK (
    (status = 'confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL)
    OR (status <> 'confirmed')
  )
);

COMMENT ON TABLE public.match_registrations IS 'Competitor signup; organizer confirms offline payment via payment_note/status.';

CREATE INDEX IF NOT EXISTS idx_match_registrations_match_id ON public.match_registrations (match_id);
CREATE INDEX IF NOT EXISTS idx_match_registrations_competitor ON public.match_registrations (competitor_user_id);
CREATE INDEX IF NOT EXISTS idx_match_registrations_status ON public.match_registrations (match_id, status);

ALTER TABLE public.match_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_registrations_select_own_or_organizer" ON public.match_registrations;
CREATE POLICY "match_registrations_select_own_or_organizer"
  ON public.match_registrations FOR SELECT
  TO authenticated
  USING (
    competitor_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_registrations.match_id
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_registrations_insert_competitor" ON public.match_registrations;
CREATE POLICY "match_registrations_insert_competitor"
  ON public.match_registrations FOR INSERT
  TO authenticated
  WITH CHECK (
    competitor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.status = 'published'
    )
    AND EXISTS (
      SELECT 1
      FROM public.match_squads s
      WHERE s.id = squad_id
        AND s.match_id = match_id
    )
  );

DROP POLICY IF EXISTS "match_registrations_update_competitor" ON public.match_registrations;
CREATE POLICY "match_registrations_update_competitor"
  ON public.match_registrations FOR UPDATE
  TO authenticated
  USING (
    competitor_user_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    competitor_user_id = auth.uid()
    AND status IN ('pending', 'cancelled')
    AND confirmed_at IS NULL
    AND confirmed_by IS NULL
  );

DROP POLICY IF EXISTS "match_registrations_update_organizer" ON public.match_registrations;
CREATE POLICY "match_registrations_update_organizer"
  ON public.match_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_registrations.match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_registrations.match_id
        AND m.organizer_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON TABLE public.match_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_registrations TO service_role;

-- -----------------------------------------------------------------------------
-- Stage links → BL-001 shared_stages.id (TEXT)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_stage_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  share_stage_id TEXT REFERENCES public.shared_stages (id) ON DELETE SET NULL,
  snapshot_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, sort_order)
);

COMMENT ON TABLE public.match_stage_links IS 'Ordered share links into Stage Builder published stages; PSC export reads order + RPC metadata.';

CREATE INDEX IF NOT EXISTS idx_match_stage_links_match_id ON public.match_stage_links (match_id);

ALTER TABLE public.match_stage_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "match_stage_links_select_visible" ON public.match_stage_links;
CREATE POLICY "match_stage_links_select_visible"
  ON public.match_stage_links FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND (
          m.status = 'published'
          OR m.organizer_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "match_stage_links_write_organizer" ON public.match_stage_links;
CREATE POLICY "match_stage_links_write_organizer"
  ON public.match_stage_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_stage_links_update_organizer" ON public.match_stage_links;
CREATE POLICY "match_stage_links_update_organizer"
  ON public.match_stage_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_stage_links_delete_organizer" ON public.match_stage_links;
CREATE POLICY "match_stage_links_delete_organizer"
  ON public.match_stage_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

GRANT SELECT ON TABLE public.match_stage_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_stage_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.match_stage_links TO service_role;

-- -----------------------------------------------------------------------------
-- updated_at helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at_match_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_admin_profiles_updated_at ON public.match_admin_profiles;
CREATE TRIGGER trg_match_admin_profiles_updated_at
  BEFORE UPDATE ON public.match_admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();

DROP TRIGGER IF EXISTS trg_matches_updated_at ON public.matches;
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();

DROP TRIGGER IF EXISTS trg_match_squads_updated_at ON public.match_squads;
CREATE TRIGGER trg_match_squads_updated_at
  BEFORE UPDATE ON public.match_squads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();

DROP TRIGGER IF EXISTS trg_match_registrations_updated_at ON public.match_registrations;
CREATE TRIGGER trg_match_registrations_updated_at
  BEFORE UPDATE ON public.match_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();

-- -----------------------------------------------------------------------------
-- Realtime (Supabase hosted: publication exists)
-- -----------------------------------------------------------------------------

-- Realtime: safe no-op if publication missing or table already added (local vs hosted)
DO $pub$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.match_registrations;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'match_admin: skip supabase_realtime add (%)', SQLERRM;
END
$pub$;
