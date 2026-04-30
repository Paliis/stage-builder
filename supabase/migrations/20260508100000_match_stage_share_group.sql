-- Phase C: logical share groups for match stage links (BL-027).
-- Each new publish may create a new shared_stages row; share_group_id chains versions.
-- Backfill existing rows so FK-linked match_stage_links can refresh to latest view share.

UPDATE public.shared_stages
SET share_group_id = gen_random_uuid()
WHERE share_group_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_shared_stages_share_group_created
  ON public.shared_stages (share_group_id, created_at DESC);

COMMENT ON COLUMN public.shared_stages.share_group_id IS 'Logical exercise version chain; latest view row per group used for match “refresh to latest”.';

ALTER TABLE public.match_stage_links
  ADD COLUMN IF NOT EXISTS share_group_id UUID;

COMMENT ON COLUMN public.match_stage_links.share_group_id IS 'Same as shared_stages.share_group_id for share_stage_id when set; enables organizer_refresh_match_stage_link_latest.';

UPDATE public.match_stage_links msl
SET share_group_id = ss.share_group_id
FROM public.shared_stages ss
WHERE msl.share_stage_id = ss.id AND msl.share_group_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_match_stage_links_share_group
  ON public.match_stage_links (share_group_id)
  WHERE share_group_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Organizer: point match_stage_links at newest non-expired VIEW share in group
-- -----------------------------------------------------------------------------

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

  SELECT ss.id, ss.title
  INTO v_new_share_id, v_title
  FROM public.shared_stages ss
  WHERE ss.share_group_id = v_group_id
    AND ss.mode = 'view'
    AND ss.expires_at > now()
  ORDER BY ss.created_at DESC
  LIMIT 1;

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
  IS 'Match organizer: sets share_stage_id to latest VIEW shared_stages row in match_stage_links.share_group_id; merges snapshot_meta.';

REVOKE ALL ON FUNCTION public.organizer_refresh_match_stage_link_latest(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.organizer_refresh_match_stage_link_latest(UUID) TO authenticated;
