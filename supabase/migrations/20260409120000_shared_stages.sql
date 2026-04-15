-- BL-001: опубліковані вправи (share link)
-- Застосувати в Supabase: SQL Editor → New query → вставити → Run
-- Або: supabase db push (якщо налаштовано CLI)

-- Таблиця -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_stages (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('view', 'edit')),
  payload JSONB NOT NULL,
  title TEXT NOT NULL,
  locale TEXT CHECK (locale IS NULL OR locale IN ('uk', 'en')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  edit_token_hash TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  share_group_id UUID,
  idempotency_key TEXT,
  CONSTRAINT shared_stages_payload_size CHECK (pg_column_size(payload) <= 524288)
);

COMMENT ON TABLE public.shared_stages IS 'BL-001: public share snapshots; inserts via service role / Edge Function only.';

CREATE INDEX IF NOT EXISTS idx_shared_stages_expires_at ON public.shared_stages (expires_at);

-- Один успішний повтор запиту з тим самим Idempotency-Key (не null)
CREATE UNIQUE INDEX IF NOT EXISTS shared_stages_idempotency_key_uidx
  ON public.shared_stages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- RLS: прямий SELECT/INSERT/UPDATE для anon/authenticated вимкнено ----------------
ALTER TABLE public.shared_stages ENABLE ROW LEVEL SECURITY;

-- Явно без політик anon не бачить таблицю; service_role обходить RLS
REVOKE ALL ON TABLE public.shared_stages FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.shared_stages TO service_role;

-- Публічне читання лише за відомим id через RPC (без можливості перелічити всі рядки)
CREATE OR REPLACE FUNCTION public.fetch_shared_stage(lookup_id TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(s)
  FROM public.shared_stages s
  WHERE s.id = lookup_id
    AND s.expires_at > now()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.fetch_shared_stage(TEXT) IS 'BL-001: single row by id if not expired; callable with anon key.';

REVOKE ALL ON FUNCTION public.fetch_shared_stage(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_shared_stage(TEXT) TO anon, authenticated;
