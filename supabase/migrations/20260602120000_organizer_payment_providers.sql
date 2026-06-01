-- MA-P01: organizer Monobank Acquiring X-Token (service-role / API only; status via RPC).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.organizer_payment_providers (
  organizer_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mono' CHECK (provider = 'mono'),
  mono_x_token TEXT NOT NULL,
  token_hint TEXT NOT NULL DEFAULT '',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organizer_payment_providers IS
  'Organizer payment provider credentials. mono_x_token is server-only (API + service role); clients use get_own_organizer_mono_payment_status().';

ALTER TABLE public.organizer_payment_providers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.organizer_payment_providers FROM authenticated, anon;
GRANT ALL ON public.organizer_payment_providers TO service_role;

CREATE OR REPLACE FUNCTION public.get_own_organizer_mono_payment_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.organizer_payment_providers%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF NOT public.match_organizer_write_allowed(v_uid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM public.organizer_payment_providers op
  WHERE op.organizer_id = v_uid AND op.provider = 'mono';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('connected', false);
  END IF;

  RETURN jsonb_build_object(
    'connected', true,
    'tokenHint', v_row.token_hint,
    'verifiedAt', v_row.verified_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_own_organizer_mono_payment_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_organizer_mono_payment_status() TO authenticated;
