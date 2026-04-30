-- Public squad fill + match totals for published matches only (Phase A registration UI).
-- Allows anon/authenticated clients to show free slots without SELECT on match_registrations.

CREATE OR REPLACE FUNCTION public.fetch_public_match_registration_metrics(p_match_id UUID)
RETURNS TABLE (
  squad_id UUID,
  squad_label TEXT,
  squad_sort INTEGER,
  capacity INTEGER,
  squad_taken BIGINT,
  match_total_registered BIGINT,
  match_competitor_limit INTEGER
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
    m.competitor_limit
  FROM m
  INNER JOIN public.match_squads s ON s.match_id = m.id
  ORDER BY s.sort_order;
$$;

COMMENT ON FUNCTION public.fetch_public_match_registration_metrics(UUID) IS
  'Published matches only: per-squad seat usage and match-wide registration count (anon-safe).';

GRANT EXECUTE ON FUNCTION public.fetch_public_match_registration_metrics(UUID) TO anon, authenticated;
