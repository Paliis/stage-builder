-- Guards for the cloud stage library. The editor writes here straight from the browser under the
-- public anon key, so size and count limits have to live in the database — `shared_stages` already
-- caps its payload the same way (512 KiB), it was only the account library that had no ceiling.

ALTER TABLE public.user_stages DROP CONSTRAINT IF EXISTS user_stages_payload_size;
ALTER TABLE public.user_stages
  ADD CONSTRAINT user_stages_payload_size CHECK (pg_column_size(payload) <= 524288);

/**
 * Rows per account. 200 matches the page size the library dialog reads, so an author never has
 * stages that the list cannot show. Raised in one place if real authors ever hit it.
 */
CREATE OR REPLACE FUNCTION public.enforce_user_stages_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used INTEGER;
BEGIN
  SELECT count(*) INTO used FROM public.user_stages WHERE owner_id = NEW.owner_id;
  IF used >= 200 THEN
    -- P0001 so PostgREST answers 400 with this message instead of a bare 500.
    RAISE EXCEPTION 'user_stages_quota_exceeded'
      USING HINT = 'Delete an old stage before saving a new one.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_user_stages_quota() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_user_stages_quota ON public.user_stages;
CREATE TRIGGER trg_user_stages_quota
  BEFORE INSERT ON public.user_stages
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_stages_quota();
