-- V1: event type (training / match / classification) + PractiScore match_level (L1–L5), both optional.

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_event_kind TEXT;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_match_event_kind_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_match_event_kind_check
  CHECK (
    match_event_kind IS NULL
    OR match_event_kind IN ('training', 'match', 'classification')
  );

COMMENT ON COLUMN public.matches.match_event_kind IS
  'Portal-only: training | match | classification; filters/display (not necessarily synced to PSC).';

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS ps_match_level TEXT;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_ps_match_level_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_ps_match_level_check
  CHECK (ps_match_level IS NULL OR ps_match_level IN ('L1', 'L2', 'L3', 'L4', 'L5'));

COMMENT ON COLUMN public.matches.ps_match_level IS
  'PractiScore match_def.match_level (Level I–V). Nullable — omit in export when unset.';
