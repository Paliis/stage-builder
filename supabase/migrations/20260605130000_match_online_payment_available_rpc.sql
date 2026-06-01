-- Public flag: organizer has verified Mono token for a published match (no secrets exposed).

CREATE OR REPLACE FUNCTION public.match_online_payment_available(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    INNER JOIN public.organizer_payment_providers op
      ON op.organizer_id = m.organizer_id
      AND op.provider = 'mono'
      AND op.verified_at IS NOT NULL
      AND length(trim(op.mono_x_token)) > 0
    WHERE m.id = p_match_id
      AND m.status = 'published'
  );
$$;

REVOKE ALL ON FUNCTION public.match_online_payment_available(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_online_payment_available(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.match_online_payment_available(UUID) IS
  'True when match is published and organizer has a verified Monobank Acquiring token (for shooter pay-online CTA).';
