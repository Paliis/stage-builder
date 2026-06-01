-- Add seminar to portal event kind taxonomy (training / match / classification / seminar).

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_match_event_kind_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_match_event_kind_check
  CHECK (
    match_event_kind IS NULL
    OR match_event_kind IN ('training', 'match', 'classification', 'seminar')
  );

COMMENT ON COLUMN public.matches.match_event_kind IS
  'Portal-only: training | match | classification | seminar; filters/display (not necessarily synced to PSC).';
