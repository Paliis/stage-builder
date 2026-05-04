-- Extends participant_registration_defaults after base table (20260510120000).
-- Region, weapon_class ids, categories[]; migrates legacy "category" text if present.

ALTER TABLE public.participant_registration_defaults
  ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS weapon_class TEXT NOT NULL DEFAULT '';

ALTER TABLE public.participant_registration_defaults
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'participant_registration_defaults'
      AND column_name = 'category'
  ) THEN
    UPDATE public.participant_registration_defaults
    SET categories = COALESCE(
      (
        SELECT array_agg(trim(both x))
        FROM unnest(string_to_array(COALESCE(category, ''), ',')) AS t(x)
        WHERE trim(both x) <> ''
      ),
      '{}'::text[]
    );
    ALTER TABLE public.participant_registration_defaults DROP COLUMN category;
  END IF;
END $$;

COMMENT ON COLUMN public.participant_registration_defaults.region IS
  'Region / state for PractiScore-style metadata.';
COMMENT ON COLUMN public.participant_registration_defaults.weapon_class IS
  'Weapon class id: shotgun, handgun, rifle, pcc, mini_rifle.';
COMMENT ON COLUMN public.participant_registration_defaults.categories IS
  'Shooter category ids from catalog (multiple allowed).';
