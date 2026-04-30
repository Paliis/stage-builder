-- Optional prematch day (RO / judges) on the same match row: separate squads via squad_phase.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS prematch_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS planned_main_squad_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS planned_prematch_squad_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.matches.prematch_enabled IS
  'If true, prematch day exists; squads with squad_phase=prematch are separate from main-day squads.';
COMMENT ON COLUMN public.matches.planned_main_squad_count IS
  'Target number of main-day squads (organizer vs actual match_squads rows; UI hint).';
COMMENT ON COLUMN public.matches.planned_prematch_squad_count IS
  'Target prematch squads when prematch_enabled; must be >=1 when prematch is on.';

ALTER TABLE public.match_squads
  ADD COLUMN IF NOT EXISTS squad_phase TEXT NOT NULL DEFAULT 'main';

UPDATE public.match_squads
SET squad_phase = 'main'
WHERE squad_phase IS NULL OR trim(squad_phase) = '';

ALTER TABLE public.match_squads DROP CONSTRAINT IF EXISTS match_squads_squad_phase_check;
ALTER TABLE public.match_squads ADD CONSTRAINT match_squads_squad_phase_check
  CHECK (squad_phase IN ('main', 'prematch'));

COMMENT ON COLUMN public.match_squads.squad_phase IS 'main = match day; prematch = day(s) before for RO/judges.';

-- Sync planned main count with existing squads (at least 1).
UPDATE public.matches m
SET planned_main_squad_count = GREATEST(
  1,
  COALESCE((SELECT COUNT(*)::int FROM public.match_squads s WHERE s.match_id = m.id AND s.squad_phase = 'main'), 0),
  m.planned_main_squad_count
);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_planned_main_positive;
ALTER TABLE public.matches ADD CONSTRAINT matches_planned_main_positive
  CHECK (planned_main_squad_count > 0);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_planned_prematch_nonneg;
ALTER TABLE public.matches ADD CONSTRAINT matches_planned_prematch_nonneg
  CHECK (planned_prematch_squad_count >= 0);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_prematch_when_enabled;
ALTER TABLE public.matches ADD CONSTRAINT matches_prematch_when_enabled
  CHECK (NOT prematch_enabled OR planned_prematch_squad_count > 0);

-- --- RPC: metrics include squad_phase; order prematch first ---------------------------------

DROP FUNCTION IF EXISTS public.fetch_public_match_registration_metrics(UUID);

CREATE FUNCTION public.fetch_public_match_registration_metrics(p_match_id UUID)
RETURNS TABLE (
  squad_id UUID,
  squad_label TEXT,
  squad_sort INTEGER,
  capacity INTEGER,
  squad_taken BIGINT,
  match_total_registered BIGINT,
  match_competitor_limit INTEGER,
  squad_phase TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH m AS (
    SELECT id, competitor_limit
    FROM public.matches
    WHERE id = p_match_id
      AND status = 'published'
  ),
  totals AS (
    SELECT COUNT(*)::bigint AS c
    FROM public.match_registrations r
    INNER JOIN m ON r.match_id = m.id
    WHERE r.status IN ('pending', 'confirmed')
  )
  SELECT
    s.id,
    s.label,
    s.sort_order,
    s.capacity,
    COALESCE(
      (
        SELECT COUNT(*)::bigint
        FROM public.match_registrations r
        WHERE r.squad_id = s.id
          AND r.status IN ('pending', 'confirmed')
      ),
      0::bigint
    ),
    (SELECT c FROM totals),
    m.competitor_limit,
    s.squad_phase
  FROM m
  INNER JOIN public.match_squads s ON s.match_id = m.id
  ORDER BY (CASE WHEN s.squad_phase = 'prematch' THEN 0 ELSE 1 END), s.sort_order;
$$;

COMMENT ON FUNCTION public.fetch_public_match_registration_metrics(UUID) IS
  'Published matches only: per-squad fill + phase (main/prematch), match total registrations.';

GRANT EXECUTE ON FUNCTION public.fetch_public_match_registration_metrics(UUID) TO anon, authenticated;

-- --- Public roster: show phase -------------------------------------------------------------

DROP FUNCTION IF EXISTS public.fetch_public_match_roster(UUID);

CREATE FUNCTION public.fetch_public_match_roster(p_match_id UUID)
RETURNS TABLE (
  squad_phase TEXT,
  squad_sort INTEGER,
  squad_label TEXT,
  display_name TEXT,
  division TEXT,
  classification_grade TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sq.squad_phase,
    sq.sort_order,
    sq.label,
    COALESCE(NULLIF(trim(pr.display_name), ''), '—') AS display_name,
    r.division,
    r.classification_grade
  FROM public.match_registrations r
  INNER JOIN public.match_squads sq ON sq.id = r.squad_id
  INNER JOIN public.matches m ON m.id = r.match_id
  LEFT JOIN public.match_admin_profiles pr ON pr.user_id = r.competitor_user_id
  WHERE r.match_id = p_match_id
    AND m.status = 'published'
    AND m.participant_list_visibility = 'open'
    AND r.status = 'confirmed'
  ORDER BY (CASE WHEN sq.squad_phase = 'prematch' THEN 0 ELSE 1 END), sq.sort_order, r.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_public_match_roster(UUID) TO anon, authenticated;
