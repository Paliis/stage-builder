-- Public roster: same display_name resolution as organizer (participant defaults, then profile).

DROP FUNCTION IF EXISTS public.fetch_public_match_roster(UUID);

CREATE FUNCTION public.fetch_public_match_roster(p_match_id UUID)
RETURNS TABLE (
  squad_phase TEXT,
  squad_sort INTEGER,
  squad_label TEXT,
  display_name TEXT,
  division TEXT,
  categories JSONB,
  registration_status TEXT
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
    COALESCE(
      NULLIF(
        trim(
          concat_ws(
            ' ',
            NULLIF(trim(d.last_name), ''),
            NULLIF(trim(d.first_name), '')
          )
        ),
        ''
      ),
      NULLIF(trim(pr.display_name), ''),
      '—'
    ) AS display_name,
    r.division,
    COALESCE(r.categories, '[]'::jsonb) AS categories,
    r.status::text AS registration_status
  FROM public.match_registrations r
  INNER JOIN public.match_squads sq ON sq.id = r.squad_id
  INNER JOIN public.matches m ON m.id = r.match_id
  LEFT JOIN public.participant_registration_defaults d ON d.user_id = r.competitor_user_id
  LEFT JOIN public.match_admin_profiles pr ON pr.user_id = r.competitor_user_id
  WHERE r.match_id = p_match_id
    AND m.status = 'published'
    AND m.participant_list_visibility = 'open'
    AND r.status IN ('pending', 'confirmed')
  ORDER BY (CASE WHEN sq.squad_phase = 'prematch' THEN 0 ELSE 1 END), sq.sort_order, r.created_at;
$$;

COMMENT ON FUNCTION public.fetch_public_match_roster(UUID) IS
  'Published matches, open list: registrations with status pending|confirmed; display_name from participant last+first name then match_admin_profiles.';

GRANT EXECUTE ON FUNCTION public.fetch_public_match_roster(UUID) TO anon, authenticated;
