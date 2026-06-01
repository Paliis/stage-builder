-- MA-P06: organizer roster exposes online payment metadata for «онлайн» badge.

DROP FUNCTION IF EXISTS public.fetch_organizer_match_registration_roster(UUID);

CREATE OR REPLACE FUNCTION public.fetch_organizer_match_registration_roster(p_match_id UUID)
RETURNS TABLE (
  registration_id UUID,
  competitor_user_id UUID,
  display_name TEXT,
  squad_id UUID,
  squad_label TEXT,
  squad_phase TEXT,
  squad_sort_order INTEGER,
  squad_capacity INTEGER,
  status TEXT,
  division TEXT,
  classification_grade TEXT,
  registration_created_at TIMESTAMPTZ,
  payment_note TEXT,
  payment_received BOOLEAN,
  payment_provider TEXT,
  paid_at TIMESTAMPTZ,
  phone TEXT,
  competitor_region TEXT,
  participant_payment_option TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.competitor_user_id,
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
      ''
    )::text AS display_name,
    r.squad_id,
    sq.label,
    sq.squad_phase::text,
    sq.sort_order,
    sq.capacity,
    r.status,
    r.division,
    r.classification_grade,
    r.created_at,
    r.payment_note,
    r.payment_received,
    r.payment_provider,
    r.paid_at,
    r.phone,
    r.competitor_region,
    r.participant_payment_option
  FROM public.match_registrations r
  INNER JOIN public.matches m ON m.id = r.match_id
  INNER JOIN public.match_squads sq ON sq.id = r.squad_id AND sq.match_id = m.id
  LEFT JOIN public.participant_registration_defaults d ON d.user_id = r.competitor_user_id
  LEFT JOIN public.match_admin_profiles pr ON pr.user_id = r.competitor_user_id
  WHERE r.match_id = p_match_id
    AND m.organizer_id = auth.uid()
  ORDER BY sq.sort_order, r.created_at;
$$;

REVOKE ALL ON FUNCTION public.fetch_organizer_match_registration_roster(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fetch_organizer_match_registration_roster(UUID) TO authenticated;

COMMENT ON FUNCTION public.fetch_organizer_match_registration_roster(UUID) IS
  'Match owner: roster with squad, payment fields (incl. payment_provider, paid_at), phone, region, participant_payment_option.';
