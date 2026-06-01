-- MA-P02: three entry-fee tiers per match (kopecks, UAH).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS entry_fee_standard_kop INTEGER,
  ADD COLUMN IF NOT EXISTS entry_fee_military_kop INTEGER,
  ADD COLUMN IF NOT EXISTS entry_fee_lady_junior_kop INTEGER;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_entry_fee_standard_kop_check;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_entry_fee_military_kop_check;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_entry_fee_lady_junior_kop_check;

ALTER TABLE public.matches ADD CONSTRAINT matches_entry_fee_standard_kop_check CHECK (
  entry_fee_standard_kop IS NULL OR entry_fee_standard_kop >= 0
);
ALTER TABLE public.matches ADD CONSTRAINT matches_entry_fee_military_kop_check CHECK (
  entry_fee_military_kop IS NULL OR entry_fee_military_kop >= 0
);
ALTER TABLE public.matches ADD CONSTRAINT matches_entry_fee_lady_junior_kop_check CHECK (
  entry_fee_lady_junior_kop IS NULL OR entry_fee_lady_junior_kop >= 0
);

COMMENT ON COLUMN public.matches.entry_fee_standard_kop IS 'Entry fee (UAH kopecks), standard tier.';
COMMENT ON COLUMN public.matches.entry_fee_military_kop IS 'Entry fee kopecks when shooter has military category.';
COMMENT ON COLUMN public.matches.entry_fee_lady_junior_kop IS 'Entry fee kopecks for lady / junior / lady_junior categories.';
