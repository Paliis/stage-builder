-- Optional PSC / PractiScore-style fields for shooter defaults (account page + future export).

ALTER TABLE public.participant_registration_defaults
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS weapon_class TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.participant_registration_defaults.region IS
  'Free text: IPSC region / state (maps to PractiScore region fields in exports).';
COMMENT ON COLUMN public.participant_registration_defaults.category IS
  'PS category flags as text (e.g. Lady, Junior); comma-separated if multiple.';
COMMENT ON COLUMN public.participant_registration_defaults.weapon_class IS
  'Weapon or discipline class label for PSC-style metadata.';
