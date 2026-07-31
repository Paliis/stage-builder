-- MA-E03: normalize category ids in summary (Lady vs lady, etc.).

CREATE OR REPLACE FUNCTION public.fetch_public_match_participant_summary(p_match_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH gate AS (
    SELECT m.id, m.discipline
    FROM public.matches m
    WHERE m.id = p_match_id
      AND m.status = 'published'
      AND m.participant_list_visibility = 'open'
  ),
  regs AS (
    SELECT r.division, r.status, r.categories
    FROM public.match_registrations r
    INNER JOIN gate g ON g.id = r.match_id
    WHERE r.status IN ('pending', 'confirmed')
  ),
  div_agg AS (
    SELECT
      lower(trim(r.division)) AS division,
      count(*) FILTER (WHERE r.status = 'confirmed')::int AS confirmed,
      count(*) FILTER (WHERE r.status = 'pending')::int AS pending
    FROM regs r
    WHERE trim(r.division) <> ''
    GROUP BY lower(trim(r.division))
  ),
  cat_elems AS (
    SELECT
      lower(trim(elem.value)) AS category_id,
      r.status
    FROM regs r
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE
        WHEN jsonb_array_length(COALESCE(r.categories, '[]'::jsonb)) > 0 THEN r.categories
        ELSE '["general"]'::jsonb
      END
    ) AS elem(value)
    WHERE trim(elem.value) <> ''
  ),
  cat_agg AS (
    SELECT
      c.category_id,
      count(*) FILTER (WHERE c.status = 'confirmed')::int AS confirmed,
      count(*) FILTER (WHERE c.status = 'pending')::int AS pending
    FROM cat_elems c
    GROUP BY c.category_id
  )
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM gate) THEN
      jsonb_build_object(
        'discipline',
        (SELECT discipline FROM gate LIMIT 1),
        'by_division',
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'division',
                d.division,
                'confirmed',
                d.confirmed,
                'pending',
                d.pending
              )
              ORDER BY d.division
            )
            FROM div_agg d
          ),
          '[]'::jsonb
        ),
        'by_category',
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'category',
                c.category_id,
                'confirmed',
                c.confirmed,
                'pending',
                c.pending
              )
              ORDER BY c.category_id
            )
            FROM cat_agg c
          ),
          '[]'::jsonb
        )
      )
    ELSE NULL
  END;
$$;
