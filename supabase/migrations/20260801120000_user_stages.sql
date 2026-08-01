-- SB-CL01: cloud library of stages saved from the editor.
-- `payload` holds the same envelope as the `.stage.json` export (format/version/stage/briefing);
-- the file download stays available as export, the cloud row is the primary storage.

CREATE TABLE IF NOT EXISTS public.user_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  weapon_class TEXT NOT NULL
    CHECK (weapon_class IN ('shotgun', 'handgun', 'rifle', 'pcc', 'mini_rifle')),
  schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_stages IS
  'Stage Builder: per-user saved stages; payload = stage project file envelope.';
COMMENT ON COLUMN public.user_stages.schema_version IS
  'STAGE_PROJECT_VERSION of payload at save time; client migrates older payloads on open.';

CREATE INDEX IF NOT EXISTS user_stages_owner_updated_idx
  ON public.user_stages (owner_id, updated_at DESC);

ALTER TABLE public.user_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_stages_select_own" ON public.user_stages;
CREATE POLICY "user_stages_select_own"
  ON public.user_stages FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "user_stages_insert_own" ON public.user_stages;
CREATE POLICY "user_stages_insert_own"
  ON public.user_stages FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "user_stages_update_own" ON public.user_stages;
CREATE POLICY "user_stages_update_own"
  ON public.user_stages FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "user_stages_delete_own" ON public.user_stages;
CREATE POLICY "user_stages_delete_own"
  ON public.user_stages FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_stages TO service_role;

DROP TRIGGER IF EXISTS trg_user_stages_updated_at ON public.user_stages;
CREATE TRIGGER trg_user_stages_updated_at
  BEFORE UPDATE ON public.user_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_match_admin();
