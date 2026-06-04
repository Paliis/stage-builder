-- Single programme briefing PDF per match (organizer upload when stages are not in Stage Builder).

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS programme_briefing_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS programme_briefing_pdf_storage_path TEXT;

COMMENT ON COLUMN public.matches.programme_briefing_pdf_url IS
  'Public URL of one combined programme briefing PDF; shown on match card when programme is visible.';
COMMENT ON COLUMN public.matches.programme_briefing_pdf_storage_path IS
  'Storage object path in match-stage-briefings; used on replace/remove by organizer.';

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
  pdf_url TEXT;
  has_programme BOOLEAN;
BEGIN
  SELECT id, starts_at, stages_visible_days_before, status,
         NULLIF(TRIM(programme_briefing_pdf_url), '') AS programme_briefing_pdf_url
  INTO m
  FROM public.matches
  WHERE id = p_match_id;

  IF NOT FOUND OR m.status <> 'published' THEN
    RETURN jsonb_build_object(
      'has_stages', FALSE,
      'publicly_visible', FALSE,
      'available_from', NULL,
      'programme_briefing_pdf_url', NULL,
      'stages', '[]'::JSONB
    );
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO stage_cnt
  FROM public.match_stage_links msl
  WHERE msl.match_id = p_match_id;

  pdf_url := m.programme_briefing_pdf_url;
  has_programme := stage_cnt > 0 OR pdf_url IS NOT NULL;

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
    'has_stages', has_programme,
    'publicly_visible', vis,
    'available_from', CASE WHEN avail IS NULL THEN NULL ELSE to_char(avail, 'YYYY-MM-DD') END,
    'programme_briefing_pdf_url', CASE WHEN vis THEN pdf_url ELSE NULL END,
    'stages', stages_json
  );
END;
$$;

COMMENT ON FUNCTION public.fetch_public_match_programme(UUID) IS
  'Public match programme: stage links + optional single programme PDF when visibility window is open.';
