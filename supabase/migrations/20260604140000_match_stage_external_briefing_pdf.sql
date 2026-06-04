-- External stage briefing PDFs (organizer upload when exercise was not built in Stage Builder).
-- Path: {organizer_id}/{match_id}/{link_id}.pdf in public bucket match-stage-briefings.
-- Row: match_stage_links.share_stage_id NULL, snapshot_meta.source = 'external_pdf'.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-stage-briefings',
  'match-stage-briefings',
  true,
  15728640,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "match_stage_briefings_select_public" ON storage.objects;
CREATE POLICY "match_stage_briefings_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'match-stage-briefings');

DROP POLICY IF EXISTS "match_stage_briefings_insert_organizer_match" ON storage.objects;
CREATE POLICY "match_stage_briefings_insert_organizer_match"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'match-stage-briefings'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = split_part(name, '/', 2)::uuid
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_stage_briefings_update_own" ON storage.objects;
CREATE POLICY "match_stage_briefings_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'match-stage-briefings' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'match-stage-briefings' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "match_stage_briefings_delete_own" ON storage.objects;
CREATE POLICY "match_stage_briefings_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'match-stage-briefings' AND split_part(name, '/', 1) = auth.uid()::text);

COMMENT ON TABLE public.match_stage_links IS
  'Ordered programme rows: Stage Builder share (share_stage_id) and/or external PDF briefing (snapshot_meta.source = external_pdf).';
