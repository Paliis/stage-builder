-- Public roster: participant categories + payment_received (no raw payment_note).

DROP FUNCTION IF EXISTS public.fetch_public_match_roster(UUID);

CREATE FUNCTION public.fetch_public_match_roster(p_match_id UUID)
RETURNS TABLE (
  squad_phase TEXT,
  squad_sort INTEGER,
  squad_label TEXT,
  display_name TEXT,
  division TEXT,
  categories JSONB,
  payment_received BOOLEAN
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
    COALESCE(r.categories, '[]'::jsonb) AS categories,
    COALESCE(r.payment_received, false) AS payment_received
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

COMMENT ON FUNCTION public.fetch_public_match_roster(UUID) IS
  'Published matches, open participant list: confirmed shooters with display names, division, shooter categories[], payment_received flag (no user ids / no payment memo).';

GRANT EXECUTE ON FUNCTION public.fetch_public_match_roster(UUID) TO anon, authenticated;
