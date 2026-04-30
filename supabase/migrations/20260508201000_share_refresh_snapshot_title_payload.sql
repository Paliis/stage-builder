-- Align refreshed title_snapshot with app rule: briefing.documentTitle, then stage.name, then shared_stages.title.

CREATE OR REPLACE FUNCTION public.organizer_refresh_match_stage_link_latest(p_link_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_match_id UUID;
  v_group_id UUID;
  v_new_share_id TEXT;
  v_title TEXT;
BEGIN
  SELECT m.organizer_id, msl.match_id, msl.share_group_id
  INTO v_org_id, v_match_id, v_group_id
  FROM public.match_stage_links msl
  JOIN public.matches m ON m.id = msl.match_id
  WHERE msl.id = p_link_id;

  IF v_match_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'link_not_found');
  END IF;

  IF auth.uid() IS NULL OR v_org_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NOT public.match_organizer_write_allowed(v_org_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'organizer_not_active');
  END IF;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_share_group');
  END IF;

  SELECT sid, display_title
  INTO v_new_share_id, v_title
  FROM (
    SELECT
      ss.id AS sid,
      substring(trim(coalesce(
        NULLIF(trim(ss.payload -> 'briefing' ->> 'documentTitle'), ''),
        NULLIF(trim(ss.payload -> 'stage' ->> 'name'), ''),
        NULLIF(trim(ss.title::text), ''),
        'Stage'

      )) FROM 1 FOR 500)::text AS display_title
    FROM public.shared_stages ss
    WHERE ss.share_group_id = v_group_id
      AND ss.mode = 'view'
      AND ss.expires_at > now()
    ORDER BY ss.created_at DESC
    LIMIT 1
  ) latest;

  IF v_new_share_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_latest_share');
  END IF;

  UPDATE public.match_stage_links msl
  SET
    share_stage_id = v_new_share_id,
    snapshot_meta =
      COALESCE(msl.snapshot_meta, '{}'::jsonb)
      || jsonb_build_object(
        'share_refreshed_at', to_jsonb((now() AT TIME ZONE 'utc')),
        'title_snapshot', to_jsonb(COALESCE(v_title, ''))
      )
  WHERE msl.id = p_link_id;

  RETURN jsonb_build_object(
    'ok', true,
    'share_stage_id', v_new_share_id,
    'share_group_id', v_group_id
  );
END;
$$;

COMMENT ON FUNCTION public.organizer_refresh_match_stage_link_latest(UUID)
  IS 'Match organizer: latest VIEW share; title_snapshot prefers payload briefing.documentTitle then stage.name.';
