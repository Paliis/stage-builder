-- Platform owner: manage match organizers (pending / active / blocked).
-- Apply after match_admin MVP. Organizer write access requires organizer_status = 'active'.

-- -----------------------------------------------------------------------------
-- Platform admins (manual seed: INSERT first owner user_id)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.portal_platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.portal_platform_admins IS 'Portal owners: full organizer directory + status edits via RPC platform_*';

ALTER TABLE public.portal_platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_platform_admins_select_self" ON public.portal_platform_admins;
CREATE POLICY "portal_platform_admins_select_self"
  ON public.portal_platform_admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON TABLE public.portal_platform_admins TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.portal_platform_admins TO service_role;

-- -----------------------------------------------------------------------------
-- Organizer status on profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.match_admin_profiles
  ADD COLUMN IF NOT EXISTS organizer_status TEXT
  CHECK (organizer_status IS NULL OR organizer_status IN ('pending', 'active', 'blocked'));

COMMENT ON COLUMN public.match_admin_profiles.organizer_status IS 'pending = new; active = can manage matches; blocked = revoked';

UPDATE public.match_admin_profiles
SET organizer_status = 'active'
WHERE organizer_status IS NULL;

ALTER TABLE public.match_admin_profiles
  ALTER COLUMN organizer_status SET DEFAULT 'pending';

ALTER TABLE public.match_admin_profiles
  ALTER COLUMN organizer_status SET NOT NULL;

-- Profiles for anyone who already has matches (backward compatibility)
INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
SELECT DISTINCT m.organizer_id, NULL::text, 'active'
FROM public.matches m
WHERE NOT EXISTS (
  SELECT 1 FROM public.match_admin_profiles p WHERE p.user_id = m.organizer_id
);

-- -----------------------------------------------------------------------------
-- Column-level UPDATE: shooters cannot toggle their own organizer_status
-- -----------------------------------------------------------------------------

REVOKE UPDATE ON TABLE public.match_admin_profiles FROM authenticated;
GRANT UPDATE (display_name) ON TABLE public.match_admin_profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS: platform admins see all organizer profiles
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "match_admin_profiles_platform_admin_select_all" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_platform_admin_select_all"
  ON public.match_admin_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.portal_platform_admins a
      WHERE a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_admin_profiles_insert_own" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_insert_own"
  ON public.match_admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organizer_status = 'pending'
  );

-- -----------------------------------------------------------------------------
-- Helpers + RPC (SECURITY DEFINER)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_organizer_write_allowed(p_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.match_admin_profiles m
    WHERE m.user_id = p_org AND m.organizer_status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.portal_platform_admins p WHERE p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_list_match_organizers()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  organizer_status TEXT,
  matches_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.platform_is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH org_ids AS (
    SELECT DISTINCT organizer_id AS uid FROM public.matches
    UNION
    SELECT p.user_id AS uid FROM public.match_admin_profiles p
  )
  SELECT
    o.uid,
    au.email::text,
    COALESCE(mp.display_name, ''::text) AS display_name,
    COALESCE(mp.organizer_status, 'pending'::text) AS organizer_status,
    COALESCE((SELECT COUNT(*)::bigint FROM public.matches m WHERE m.organizer_id = o.uid), 0::bigint)
  FROM org_ids o
  JOIN auth.users au ON au.id = o.uid
  LEFT JOIN public.match_admin_profiles mp ON mp.user_id = o.uid;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_set_match_organizer_status(p_target_user UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.platform_is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'active', 'blocked') THEN
    RAISE EXCEPTION 'bad status';
  END IF;

  INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
  VALUES (p_target_user, NULL, p_status)
  ON CONFLICT (user_id) DO UPDATE SET
    organizer_status = EXCLUDED.organizer_status,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_organizer_write_allowed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_match_organizers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_set_match_organizer_status(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- Tighten match module write policies (active organizers only)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "matches_insert_organizer" ON public.matches;
CREATE POLICY "matches_insert_organizer"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id = auth.uid()
    AND public.match_organizer_write_allowed(auth.uid())
  );

DROP POLICY IF EXISTS "matches_update_organizer" ON public.matches;
CREATE POLICY "matches_update_organizer"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    organizer_id = auth.uid()
    AND public.match_organizer_write_allowed(auth.uid())
  )
  WITH CHECK (
    organizer_id = auth.uid()
    AND public.match_organizer_write_allowed(auth.uid())
  );

DROP POLICY IF EXISTS "matches_delete_organizer" ON public.matches;
CREATE POLICY "matches_delete_organizer"
  ON public.matches FOR DELETE
  TO authenticated
  USING (
    organizer_id = auth.uid()
    AND public.match_organizer_write_allowed(auth.uid())
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
        AND public.match_organizer_write_allowed(m.organizer_id)
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
        AND public.match_organizer_write_allowed(m.organizer_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
        AND public.match_organizer_write_allowed(m.organizer_id)
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
        AND public.match_organizer_write_allowed(m.organizer_id)
    )
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
        AND public.match_organizer_write_allowed(m.organizer_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_registrations.match_id
        AND m.organizer_id = auth.uid()
        AND public.match_organizer_write_allowed(m.organizer_id)
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
        AND public.match_organizer_write_allowed(m.organizer_id)
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
        AND public.match_organizer_write_allowed(m.organizer_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
        AND public.match_organizer_write_allowed(m.organizer_id)
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
        AND public.match_organizer_write_allowed(m.organizer_id)
    )
  );
