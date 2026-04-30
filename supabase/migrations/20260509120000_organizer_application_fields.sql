-- Organizer applications: optional free-text fields, moderation note when blocked,
-- tightened INSERT rule (moderation_note must be NULL for self-insert),
-- RPC list/set extended. Notifications: configure Supabase Database Webhooks (see docs).

-- -----------------------------------------------------------------------------
-- Columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.match_admin_profiles
  ADD COLUMN IF NOT EXISTS organizer_application_contact TEXT,
  ADD COLUMN IF NOT EXISTS organizer_application_past_matches TEXT,
  ADD COLUMN IF NOT EXISTS organizer_moderation_note TEXT;

COMMENT ON COLUMN public.match_admin_profiles.organizer_application_contact IS 'Applicant Telegram/phone/email — self-service only on first insert.';
COMMENT ON COLUMN public.match_admin_profiles.organizer_application_past_matches IS 'Applicant URLs or notes about past matches — self-service insert only.';
COMMENT ON COLUMN public.match_admin_profiles.organizer_moderation_note IS 'Shown to applicant when blocked; set only via platform_set_match_organizer_status.';

ALTER TABLE public.match_admin_profiles DROP CONSTRAINT IF EXISTS match_admin_profiles_app_contact_len;
ALTER TABLE public.match_admin_profiles ADD CONSTRAINT match_admin_profiles_app_contact_len
  CHECK (organizer_application_contact IS NULL OR char_length(organizer_application_contact) <= 280);

ALTER TABLE public.match_admin_profiles DROP CONSTRAINT IF EXISTS match_admin_profiles_app_past_len;
ALTER TABLE public.match_admin_profiles ADD CONSTRAINT match_admin_profiles_app_past_len
  CHECK (organizer_application_past_matches IS NULL OR char_length(organizer_application_past_matches) <= 2000);

ALTER TABLE public.match_admin_profiles DROP CONSTRAINT IF EXISTS match_admin_profiles_moderation_len;
ALTER TABLE public.match_admin_profiles ADD CONSTRAINT match_admin_profiles_moderation_len
  CHECK (organizer_moderation_note IS NULL OR char_length(organizer_moderation_note) <= 600);

-- -----------------------------------------------------------------------------
-- INSERT: shooters cannot inject moderation_note
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "match_admin_profiles_insert_own" ON public.match_admin_profiles;
CREATE POLICY "match_admin_profiles_insert_own"
  ON public.match_admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND organizer_status = 'pending'
    AND organizer_moderation_note IS NULL
  );

-- -----------------------------------------------------------------------------
-- Replace list RPC (add application + moderation columns — must DROP first: Postgres
-- disallows CREATE OR REPLACE when OUT / RETURNS TABLE signature changes.)

DROP FUNCTION IF EXISTS public.platform_list_match_organizers();

CREATE FUNCTION public.platform_list_match_organizers()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  organizer_status TEXT,
  matches_count BIGINT,
  organizer_application_contact TEXT,
  organizer_application_past_matches TEXT,
  organizer_moderation_note TEXT
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
    COALESCE((SELECT COUNT(*)::bigint FROM public.matches m WHERE m.organizer_id = o.uid), 0::bigint) AS matches_count,
    mp.organizer_application_contact,
    mp.organizer_application_past_matches,
    mp.organizer_moderation_note
  FROM org_ids o
  JOIN auth.users au ON au.id = o.uid
  LEFT JOIN public.match_admin_profiles mp ON mp.user_id = o.uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_list_match_organizers() TO authenticated;

-- -----------------------------------------------------------------------------
-- Set status (+ optional moderation note when blocked); drop overload (uuid, text)
-- -----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.platform_set_match_organizer_status(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.platform_set_match_organizer_status(
  p_target_user UUID,
  p_status TEXT,
  p_moderation_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note TEXT := NULLIF(btrim(COALESCE(p_moderation_note, '')), '');
BEGIN
  IF NOT public.platform_is_platform_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'active', 'blocked') THEN
    RAISE EXCEPTION 'bad status';
  END IF;
  IF p_status = 'blocked' AND v_note IS NOT NULL AND char_length(v_note) > 600 THEN
    RAISE EXCEPTION 'moderation_note too long';
  END IF;

  INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status, organizer_moderation_note)
  VALUES (p_target_user, NULL, p_status, CASE WHEN p_status = 'blocked' THEN v_note ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE SET
    organizer_status = EXCLUDED.organizer_status,
    organizer_moderation_note =
      CASE
        WHEN p_status = 'blocked' THEN EXCLUDED.organizer_moderation_note
        ELSE NULL
      END,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.platform_set_match_organizer_status(UUID, TEXT, TEXT) TO authenticated;
