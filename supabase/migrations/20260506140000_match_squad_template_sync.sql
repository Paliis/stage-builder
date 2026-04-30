-- Uniform squad grids: squad counts × shooters-per-squad (main vs prematch); rows auto-maintained.
-- competitor_limit derived via trigger; RPC organizer_sync_match_squads aligns match_squads safely.

ALTER TABLE public.match_squads DROP CONSTRAINT IF EXISTS match_squads_match_id_sort_order_key;

ALTER TABLE public.match_squads DROP CONSTRAINT IF EXISTS match_squads_match_phase_sort_unique;

ALTER TABLE public.match_squads ADD CONSTRAINT match_squads_match_phase_sort_unique UNIQUE (match_id, squad_phase, sort_order);

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS shooters_per_main_squad INTEGER;

UPDATE public.matches SET shooters_per_main_squad = 18 WHERE shooters_per_main_squad IS NULL;

ALTER TABLE public.matches ALTER COLUMN shooters_per_main_squad SET NOT NULL;

ALTER TABLE public.matches ALTER COLUMN shooters_per_main_squad SET DEFAULT 18;

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS shooters_per_prematch_squad INTEGER;

UPDATE public.matches SET shooters_per_prematch_squad = 18 WHERE shooters_per_prematch_squad IS NULL;

ALTER TABLE public.matches ALTER COLUMN shooters_per_prematch_squad SET NOT NULL;

ALTER TABLE public.matches ALTER COLUMN shooters_per_prematch_squad SET DEFAULT 18;

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_shooters_main_min;

ALTER TABLE public.matches ADD CONSTRAINT matches_shooters_main_min CHECK (shooters_per_main_squad >= 1);

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_shooters_prematch_when_enabled;

ALTER TABLE public.matches ADD CONSTRAINT matches_shooters_prematch_when_enabled CHECK (
  NOT prematch_enabled OR shooters_per_prematch_squad >= 1
);

COMMENT ON COLUMN public.matches.shooters_per_main_squad IS 'Capacity per main-day squad row (uniform).';

COMMENT ON COLUMN public.matches.shooters_per_prematch_squad IS 'Capacity per prematch squad row when prematch_enabled is true.';

UPDATE public.matches m
SET competitor_limit =
  m.planned_main_squad_count * m.shooters_per_main_squad + CASE
    WHEN m.prematch_enabled THEN m.planned_prematch_squad_count * m.shooters_per_prematch_squad
    ELSE 0
  END;

CREATE OR REPLACE FUNCTION public.trg_matches_recalc_competitor_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.shooters_per_main_squad IS NULL OR NEW.shooters_per_main_squad < 1 THEN NEW.shooters_per_main_squad := 18;
    END IF;

    IF NEW.shooters_per_prematch_squad IS NULL OR NEW.shooters_per_prematch_squad < 1 THEN NEW.shooters_per_prematch_squad := 18;
    END IF;

  ELSE
    IF NEW.shooters_per_main_squad IS NULL OR NEW.shooters_per_main_squad < 1 THEN
      NEW.shooters_per_main_squad := OLD.shooters_per_main_squad;
    END IF;

    IF NEW.shooters_per_prematch_squad IS NULL OR NEW.shooters_per_prematch_squad < 1 THEN
      NEW.shooters_per_prematch_squad := OLD.shooters_per_prematch_squad;
    END IF;

  END IF;

  NEW.competitor_limit :=
    NEW.planned_main_squad_count * NEW.shooters_per_main_squad + CASE
      WHEN COALESCE(NEW.prematch_enabled, false)
      THEN NEW.planned_prematch_squad_count * NEW.shooters_per_prematch_squad
      ELSE 0
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matches_recalc_competitor_limit ON public.matches;

CREATE TRIGGER trg_matches_recalc_competitor_limit
  BEFORE INSERT OR UPDATE ON public.matches FOR EACH ROW
  EXECUTE FUNCTION public.trg_matches_recalc_competitor_limit();

CREATE OR REPLACE FUNCTION public._squads_registered_count(p_squad_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.match_registrations r WHERE r.squad_id = p_squad_id AND r.status IN ('pending', 'confirmed');
$$;

REVOKE ALL ON FUNCTION public._squads_registered_count(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public._sync_match_phase_squads(p_match UUID, p_phase TEXT, p_target_n INT, p_cap INT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_cnt INT;
  v_reg INT;
  v_max INT;
  v_label TEXT;
BEGIN
  IF p_phase NOT IN ('main', 'prematch') THEN RAISE EXCEPTION 'bad_phase';
  END IF;

  IF p_target_n = 0 THEN
    LOOP
      SELECT s.id INTO v_id
      FROM public.match_squads s
      WHERE s.match_id = p_match AND s.squad_phase = p_phase
      ORDER BY s.sort_order DESC
      LIMIT 1;

      EXIT WHEN v_id IS NULL;

      SELECT public._squads_registered_count(v_id) INTO v_reg;

      IF v_reg > 0 THEN
        RAISE EXCEPTION 'Cannot remove prematch squads: some still have pending or confirmed registrations. Move competitors on the organizer roster page first.'
          USING ERRCODE = 'check_violation';
      END IF;

      DELETE FROM public.match_squads WHERE id = v_id;
    END LOOP;

    RETURN;
  END IF;

  IF p_cap < 1 THEN RAISE EXCEPTION 'Invalid shooters-per-squad capacity.'; END IF;

  FOR v_id IN SELECT s.id FROM public.match_squads s WHERE s.match_id = p_match AND s.squad_phase = p_phase
  LOOP
    SELECT public._squads_registered_count(v_id) INTO v_reg;

    IF v_reg > p_cap THEN
      RAISE EXCEPTION 'Cannot lower shooters-per-squad below already registered count in at least one squad. Reassign competitors first.'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  UPDATE public.match_squads
  SET capacity = p_cap
  WHERE match_id = p_match AND squad_phase = p_phase;

  LOOP
    SELECT COUNT(*)::INT INTO v_cnt FROM public.match_squads WHERE match_id = p_match AND squad_phase = p_phase;

    EXIT WHEN v_cnt <= p_target_n;

    SELECT s.id INTO v_id
    FROM public.match_squads s
    WHERE s.match_id = p_match AND s.squad_phase = p_phase
    ORDER BY s.sort_order DESC
    LIMIT 1;

    SELECT public._squads_registered_count(v_id) INTO v_reg;

    IF v_reg > 0 THEN
      RAISE EXCEPTION 'Cannot reduce squad count: a squad to remove still has registrations. Reassign or cancel them first.'
        USING ERRCODE = 'check_violation';
    END IF;

    DELETE FROM public.match_squads WHERE id = v_id;
  END LOOP;

  LOOP
    SELECT COUNT(*)::INT INTO v_cnt FROM public.match_squads WHERE match_id = p_match AND squad_phase = p_phase;

    EXIT WHEN v_cnt >= p_target_n;

    SELECT COALESCE(MAX(sort_order), -1) INTO v_max
    FROM public.match_squads
    WHERE match_id = p_match AND squad_phase = p_phase;

    v_label :=
      CASE
        WHEN p_phase = 'prematch' THEN 'Prematch ' || (v_max + 2)::text
        ELSE 'Main ' || (v_max + 2)::text
      END;

    INSERT INTO public.match_squads (match_id, label, sort_order, capacity, squad_phase)
    VALUES (p_match, v_label, v_max + 1, p_cap, p_phase);
  END LOOP;

  UPDATE public.match_squads
  SET capacity = p_cap,
    label =
      CASE
        WHEN squad_phase = 'prematch' THEN 'Prematch ' || (sort_order + 1)::text
        ELSE 'Main ' || (sort_order + 1)::text
      END
  WHERE match_id = p_match AND squad_phase = p_phase;
END;
$$;

REVOKE ALL ON FUNCTION public._sync_match_phase_squads(UUID, TEXT, INT, INT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.organizer_sync_match_squads_internal(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD;
BEGIN
  SELECT * INTO STRICT m FROM public.matches WHERE id = p_match_id;

  IF m.prematch_enabled THEN
    PERFORM public._sync_match_phase_squads(p_match_id, 'prematch', m.planned_prematch_squad_count, m.shooters_per_prematch_squad);
  ELSE
    PERFORM public._sync_match_phase_squads(p_match_id, 'prematch', 0, 1);
  END IF;

  PERFORM public._sync_match_phase_squads(p_match_id, 'main', m.planned_main_squad_count, m.shooters_per_main_squad);
END;
$$;

REVOKE ALL ON FUNCTION public.organizer_sync_match_squads_internal(UUID) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.organizer_sync_match_squads(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m RECORD;
BEGIN
  SELECT * INTO STRICT m FROM public.matches WHERE id = p_match_id;

  IF m.organizer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not_match_owner' USING ERRCODE = '42501';
  END IF;

  IF NOT public.match_organizer_write_allowed(m.organizer_id) THEN
    RAISE EXCEPTION 'organizer_not_active' USING ERRCODE = '42501';
  END IF;

  PERFORM public.organizer_sync_match_squads_internal(p_match_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.organizer_sync_match_squads(UUID) TO authenticated;

COMMENT ON FUNCTION public.organizer_sync_match_squads(UUID) IS
  'Active organizer: rebuild match_squads from planned counts × shooters-per-squad; blocks unsafe shrinks.';

DO $boot$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.matches
  LOOP
    BEGIN
      PERFORM public.organizer_sync_match_squads_internal(r.id);
    EXCEPTION
      WHEN OTHERS THEN RAISE NOTICE 'organizer_sync bootstrap skip match %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $boot$;
