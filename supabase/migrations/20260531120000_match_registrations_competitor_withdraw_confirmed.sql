-- Competitor withdraw from a match: pending row is deleted; confirmed row becomes cancelled (frees slot).

CREATE OR REPLACE FUNCTION public.withdraw_my_match_registration(p_registration_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT r.status
  INTO v_status
  FROM public.match_registrations r
  WHERE r.id = p_registration_id
    AND r.competitor_user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_status = 'pending' THEN
    DELETE FROM public.match_registrations
    WHERE id = p_registration_id
      AND competitor_user_id = auth.uid()
      AND status = 'pending';
    RETURN FOUND;
  END IF;

  IF v_status = 'confirmed' THEN
    UPDATE public.match_registrations
    SET
      status = 'cancelled',
      confirmed_at = NULL,
      confirmed_by = NULL,
      updated_at = now()
    WHERE id = p_registration_id
      AND competitor_user_id = auth.uid()
      AND status = 'confirmed';
    RETURN FOUND;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.withdraw_my_match_registration(uuid) IS
  'Competitor withdraws own registration: DELETE pending, or confirmed → cancelled (clears confirmed_*).';

REVOKE ALL ON FUNCTION public.withdraw_my_match_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_my_match_registration(uuid) TO authenticated;
