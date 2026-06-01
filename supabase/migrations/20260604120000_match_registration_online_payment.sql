-- MA-P04/P05: online payment metadata on registrations + invoice tracking.

ALTER TABLE public.match_registrations
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT;

ALTER TABLE public.match_registrations DROP CONSTRAINT IF EXISTS match_registrations_payment_provider_check;
ALTER TABLE public.match_registrations ADD CONSTRAINT match_registrations_payment_provider_check CHECK (
  payment_provider IS NULL OR payment_provider IN ('mono')
);

COMMENT ON COLUMN public.match_registrations.paid_at IS 'When online/offline payment was recorded (online: webhook).';
COMMENT ON COLUMN public.match_registrations.payment_provider IS 'Acquirer id when paid online (mono).';
COMMENT ON COLUMN public.match_registrations.external_payment_id IS 'Provider invoice / payment id for idempotency.';

CREATE TABLE IF NOT EXISTS public.match_mono_invoices (
  registration_id UUID PRIMARY KEY REFERENCES public.match_registrations (id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  amount_kop INTEGER NOT NULL CHECK (amount_kop > 0),
  status TEXT NOT NULL DEFAULT 'created',
  modified_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.match_mono_invoices IS 'Latest Monobank invoice per registration (service role / API only).';

ALTER TABLE public.match_mono_invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.match_mono_invoices FROM authenticated, anon;
GRANT ALL ON public.match_mono_invoices TO service_role;
