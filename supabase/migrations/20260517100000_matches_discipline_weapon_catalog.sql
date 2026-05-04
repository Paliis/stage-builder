-- Match discipline ids aligned with shooter profile weapon_class / WEAPON_CLASS_ORDER.
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_discipline_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_discipline_check CHECK (
  discipline IN ('shotgun', 'handgun', 'rifle', 'pcc', 'mini_rifle')
);

COMMENT ON COLUMN public.matches.discipline IS
  'Weapon class for the match (same ids as participant_registration_defaults.weapon_class).';
