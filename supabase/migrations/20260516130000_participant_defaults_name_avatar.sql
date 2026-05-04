-- Shooter display name for PractiScore export + public avatar URL (Supabase Storage).

ALTER TABLE public.participant_registration_defaults
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.participant_registration_defaults.first_name IS
  'Given name for PSC export (match_def match_shooters sh_fn).';
COMMENT ON COLUMN public.participant_registration_defaults.last_name IS
  'Family name for PSC export (sh_ln).';
COMMENT ON COLUMN public.participant_registration_defaults.avatar_url IS
  'Public URL of profile photo; bucket participant-avatars.';

-- Storage: profile photos — path `{user_id}/…` (owner-only write).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-avatars',
  'participant-avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "participant_avatars_select_public" ON storage.objects;
CREATE POLICY "participant_avatars_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'participant-avatars');

DROP POLICY IF EXISTS "participant_avatars_insert_own" ON storage.objects;
CREATE POLICY "participant_avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'participant-avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "participant_avatars_update_own" ON storage.objects;
CREATE POLICY "participant_avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'participant-avatars' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'participant-avatars' AND split_part(name, '/', 1) = auth.uid()::text);

DROP POLICY IF EXISTS "participant_avatars_delete_own" ON storage.objects;
CREATE POLICY "participant_avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'participant-avatars' AND split_part(name, '/', 1) = auth.uid()::text);
