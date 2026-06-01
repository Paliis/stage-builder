-- Weapon class optional (e.g. seminar); required in app UI for match/training/classification.
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_discipline_check;

ALTER TABLE public.matches
  ALTER COLUMN discipline DROP NOT NULL,
  ALTER COLUMN discipline DROP DEFAULT;

ALTER TABLE public.matches ADD CONSTRAINT matches_discipline_check CHECK (
  discipline IS NULL
  OR discipline IN ('shotgun', 'handgun', 'rifle', 'pcc', 'mini_rifle')
);

COMMENT ON COLUMN public.matches.discipline IS
  'Shooter weapon class id (shotgun, handgun, …). NULL when not applicable (e.g. seminar).';

UPDATE public.matches
SET discipline = NULL
WHERE match_event_kind = 'seminar';
