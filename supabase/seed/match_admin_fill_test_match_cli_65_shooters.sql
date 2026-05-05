-- Заповнити матч **до 65 активних заявок** (status `pending` або `confirmed`): нові рядки **`confirmed`** з тестовими `auth.users`.
--
-- За замовчуванням шукає матч із **title = 'Тестовий матч (CLI)'**.
-- Якщо назва інша — зміни `v_match_title` або задай `p_match_id` (UUID з URL `/matches/my/<id>/roster`).
--
-- Розподіл по скводах: кожен новий стрілець потрапляє в сквод із **найменшою зайнятістю** серед тих, де ще є місце (за `sort_order` при рівності).
-- Перед запуском переконайся, що сума **capacity** усіх скводів матчу **≥ 65** (інакше скрипт упаде з поясненням).
--
-- Postgres / SQL Editor або: `npm run supabase:seed:test-match-cli-65` (після `supabase:link`).
-- Повторний запуск доростить лише **бракуючих** до цілі (не дублює наявних активних).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_match_title constant text := 'Тестовий матч (CLI)';
  p_match_id uuid := NULL; -- optional: set to your match UUID to skip title lookup
  org_id uuid;
  inst_id uuid;
  v_pw text;
  tgt constant int := 65;
  cur int;
  need int;
  mid uuid;
  target_squad uuid;
  new_uid uuid;
  new_em text;
  cap_sum int;
  div_roll constant text[] := ARRAY['Modified', 'Standard', 'Classic', 'Production'];
  grade_roll constant text[] := ARRAY['U', 'B', 'A', 'M'];
  div_idx int;
  gr_idx int;
  i int := 0;
BEGIN
  IF p_match_id IS NOT NULL THEN
    mid := p_match_id;
  ELSE
    SELECT m.id INTO mid FROM public.matches m WHERE m.title = v_match_title LIMIT 1;
  END IF;

  IF mid IS NULL THEN
    RAISE EXCEPTION 'Match not found: title % (or set p_match_id in this script to your match UUID).', v_match_title;
  END IF;

  SELECT organizer_id INTO org_id FROM public.matches WHERE id = mid;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Match % has no organizer_id', mid;
  END IF;

  SELECT COALESCE(SUM(s.capacity), 0)::int INTO cap_sum
  FROM public.match_squads s
  WHERE s.match_id = mid;

  IF cap_sum < tgt THEN
    RAISE EXCEPTION
      'Total squad capacity % for match % is less than target % — increase planned squads / capacities and run organizer_sync.',
      cap_sum,
      mid,
      tgt;
  END IF;

  SELECT COUNT(*)::int INTO cur
  FROM public.match_registrations r
  WHERE r.match_id = mid
    AND r.status IN ('pending', 'confirmed');

  need := tgt - cur;

  IF need <= 0 THEN
    RAISE NOTICE 'Match % already has % active registrations (target %). Nothing to add.', mid, cur, tgt;
    RETURN;
  END IF;

  SELECT id INTO inst_id FROM auth.instances ORDER BY id LIMIT 1;

  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  v_pw := crypt('SeedOnly_ChangeMe_9', gen_salt('bf'));

  FOR i IN 1..need LOOP
    SELECT s.id INTO target_squad
    FROM public.match_squads s
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS c
      FROM public.match_registrations r
      WHERE r.squad_id = s.id
        AND r.match_id = mid
        AND r.status IN ('pending', 'confirmed')
    ) occ ON true
    WHERE s.match_id = mid
      AND occ.c < s.capacity
    ORDER BY occ.c ASC, s.sort_order ASC
    LIMIT 1;

    IF target_squad IS NULL THEN
      RAISE EXCEPTION
        'No squad with free capacity while adding shooter % of % (partial total %).',
        i,
        need,
        (cur + i - 1);
    END IF;

    new_em := 'stagebuilder.cli65.' || replace(gen_random_uuid()::text, '-', '') || '@local.test';
    new_uid := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    )
    VALUES (
      new_uid,
      inst_id,
      'authenticated',
      'authenticated',
      new_em,
      v_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      false,
      false
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      new_uid,
      new_uid::text,
      jsonb_build_object('sub', new_uid::text, 'email', new_em),
      'email',
      now(),
      now(),
      now()
    );

    div_idx := ((cur + i - 1) % array_length(div_roll, 1)) + 1;
    gr_idx := ((cur + i - 1) % array_length(grade_roll, 1)) + 1;

    INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
    VALUES (
      new_uid,
      format('Стрілець seed CLI №%s', cur + i),
      'pending'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      updated_at = now();

    INSERT INTO public.match_registrations (
      match_id,
      squad_id,
      competitor_user_id,
      division,
      classification_grade,
      power_factor,
      categories,
      status,
      payment_note,
      confirmed_at,
      confirmed_by
    )
    VALUES (
      mid,
      target_squad,
      new_uid,
      div_roll[div_idx],
      grade_roll[gr_idx],
      CASE WHEN ((cur + i) % 2) = 0 THEN 'MINOR'::text ELSE 'MAJOR'::text END,
      '[]'::jsonb,
      'confirmed',
      'seed: bulk fill CLI match to 65',
      now(),
      org_id
    );
  END LOOP;

  UPDATE public.matches
  SET participant_list_visibility = 'open',
      updated_at = now()
  WHERE id = mid;

  RAISE NOTICE 'Added % shooters to match_id = % (active target %).', need, mid, tgt;
END $$;
