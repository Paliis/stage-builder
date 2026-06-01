-- Match programme (stage links) public visibility: hidden until N days before match start.
-- Organizers always see links via RLS; anon/authenticated public card uses fetch_public_match_programme().

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stages_visible_days_before INTEGER
  CHECK (
    stages_visible_days_before IS NULL
    OR stages_visible_days_before >= 0
  );

COMMENT ON COLUMN public.matches.stages_visible_days_before IS
  'NULL: programme hidden on public card until organizer sets days; 0: visible immediately; N>0: visible from start of UTC day (starts_at::date - N).';

-- Existing published programmes stay visible (backward compatible).
UPDATE public.matches m
SET stages_visible_days_before = 0
WHERE m.stages_visible_days_before IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.match_stage_links msl
    WHERE msl.match_id = m.id
  );

CREATE OR REPLACE FUNCTION public.match_stages_publicly_visible(
  p_starts_at TIMESTAMPTZ,
  p_days_before INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_days_before IS NULL THEN FALSE
    WHEN p_days_before <= 0 THEN TRUE
    ELSE (NOW() AT TIME ZONE 'UTC')::DATE
      >= ((p_starts_at AT TIME ZONE 'UTC')::DATE - p_days_before)
  END;
$$;

COMMENT ON FUNCTION public.match_stages_publicly_visible(TIMESTAMPTZ, INTEGER) IS
  'Whether match programme stage links may be shown on the public card (UTC calendar days).';

CREATE OR REPLACE FUNCTION public.match_stages_available_from_date(
  p_starts_at TIMESTAMPTZ,
  p_days_before INTEGER
)
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_days_before IS NULL OR p_days_before <= 0 THEN NULL::DATE
    ELSE ((p_starts_at AT TIME ZONE 'UTC')::DATE - p_days_before)
  END;
$$;

COMMENT ON FUNCTION public.match_stages_available_from_date(TIMESTAMPTZ, INTEGER) IS
  'First UTC calendar day when programme becomes public; NULL when immediate or not scheduled.';

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
          m.organizer_id = auth.uid()
          OR (
            m.status = 'published'
            AND public.match_stages_publicly_visible(m.starts_at, m.stages_visible_days_before)
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.fetch_public_match_programme(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m RECORD;
  stage_cnt INTEGER;
  vis BOOLEAN;
  avail DATE;
  stages_json JSONB;
BEGIN
  SELECT id, starts_at, stages_visible_days_before, status
  INTO m
  FROM public.matches
  WHERE id = p_match_id;

  IF NOT FOUND OR m.status <> 'published' THEN
    RETURN jsonb_build_object(
      'has_stages', FALSE,
      'publicly_visible', FALSE,
      'available_from', NULL,
      'stages', '[]'::JSONB
    );
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO stage_cnt
  FROM public.match_stage_links msl
  WHERE msl.match_id = p_match_id;

  vis := public.match_stages_publicly_visible(m.starts_at, m.stages_visible_days_before);
  avail := public.match_stages_available_from_date(m.starts_at, m.stages_visible_days_before);

  IF vis AND stage_cnt > 0 THEN
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'sort_order', msl.sort_order,
          'share_stage_id', msl.share_stage_id,
          'snapshot_meta', msl.snapshot_meta
        )
        ORDER BY msl.sort_order
      ),
      '[]'::JSONB
    )
    INTO stages_json
    FROM public.match_stage_links msl
    WHERE msl.match_id = p_match_id;
  ELSE
    stages_json := '[]'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'has_stages', stage_cnt > 0,
    'publicly_visible', vis,
    'available_from', CASE WHEN avail IS NULL THEN NULL ELSE to_char(avail, 'YYYY-MM-DD') END,
    'stages', stages_json
  );
END;
$$;

COMMENT ON FUNCTION public.fetch_public_match_programme(UUID) IS
  'Public match card programme bundle: stage list only when visibility window open; metadata for pending message.';

GRANT EXECUTE ON FUNCTION public.fetch_public_match_programme(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_stages_publicly_visible(TIMESTAMPTZ, INTEGER) TO anon, authenticated;
