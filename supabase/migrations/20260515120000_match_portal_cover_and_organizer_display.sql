-- Public match hub: cover image URL + cached organizer display name (from match_admin_profiles).
-- Storage bucket `match-covers` for organizer uploads: path `${uid}/${match_id}/filename`.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS portal_organizer_display_name TEXT;

COMMENT ON COLUMN public.matches.cover_image_url IS
  'Optional public URL (e.g. Supabase Storage) for card image on the published match hub.';

COMMENT ON COLUMN public.matches.portal_organizer_display_name IS
  'Denormalized from match_admin_profiles.display_name for anon hub queries; refreshed on match write.';

CREATE OR REPLACE FUNCTION public.trg_matches_set_portal_organizer_display()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  SELECT NULLIF(trim(p.display_name), '') INTO v_name
  FROM public.match_admin_profiles p
  WHERE p.user_id = NEW.organizer_id;

  NEW.portal_organizer_display_name := v_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_portal_organizer_display ON public.matches;

CREATE TRIGGER trg_matches_portal_organizer_display
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_matches_set_portal_organizer_display();

UPDATE public.matches m
SET portal_organizer_display_name = NULLIF(trim(p.display_name), '')
FROM public.match_admin_profiles p
WHERE p.user_id = m.organizer_id;

-- -----------------------------------------------------------------------------
-- Storage: match cover images
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-covers',
  'match-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "match_covers_select_public" ON storage.objects;
CREATE POLICY "match_covers_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'match-covers');

DROP POLICY IF EXISTS "match_covers_insert_organizer_match" ON storage.objects;
CREATE POLICY "match_covers_insert_organizer_match"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'match-covers'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = split_part(name, '/', 2)::uuid
        AND m.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "match_covers_update_own" ON storage.objects;
CREATE POLICY "match_covers_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'match-covers' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'match-covers' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "match_covers_delete_own" ON storage.objects;
CREATE POLICY "match_covers_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'match-covers' AND split_part(name, '/', 1) = auth.uid()::text);
