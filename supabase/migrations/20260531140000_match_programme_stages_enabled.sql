-- Optional stage programme per event (seminar / training: organizer toggle).

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS programme_stages_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.matches.programme_stages_enabled IS
  'When false, hide stage programme panel in organizer UI and on public event card.';
