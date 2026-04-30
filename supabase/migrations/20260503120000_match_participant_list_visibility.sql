-- Match-level participant roster visibility: published card can expose a sanitized roster vs closed list.
-- See docs/MATCH_REGISTRATION_AND_PSC_PLAN.md §1.4 (privacy).

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS participant_list_visibility TEXT
  CHECK (
    participant_list_visibility IS NULL
    OR participant_list_visibility IN ('open', 'closed')
  );

UPDATE public.matches
SET participant_list_visibility = 'closed'
WHERE participant_list_visibility IS NULL;

ALTER TABLE public.matches
  ALTER COLUMN participant_list_visibility SET DEFAULT 'closed';

ALTER TABLE public.matches
  ALTER COLUMN participant_list_visibility SET NOT NULL;

COMMENT ON COLUMN public.matches.participant_list_visibility IS
  'closed: roster details only organizer + each competitor sees own row (RLS); open: public sanitized roster via fetch_public_match_roster()';

-- Public roster without exposing competitor_user_id or email (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.fetch_public_match_roster(p_match_id UUID)
RETURNS TABLE (
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
  ORDER BY sq.sort_order, r.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_public_match_roster(UUID) TO anon, authenticated;
