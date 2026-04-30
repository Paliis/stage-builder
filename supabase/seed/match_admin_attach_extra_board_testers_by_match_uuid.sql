-- Підключити до **довільного матчу** тих самих 8 тестових стрільців (по 4 у перший і другий **main**-сквод),
-- використовуючи ті самі email, що й `match_admin_test_seed.sql`.
--
-- Перед виконанням у SQL Editor (**postgres**) у блоці `DECLARE` нижче замінити **`00000000-0000-0000-0000-000000000000`**
-- на UUID матчу з URL: `/uk/matches/my/<UUID>/roster`
--
-- Умова: щонайменше **2** скводи `squad_phase = 'main'` (як типова сітка).
-- Повторний запуск безпечний: збіги за email або за парою (матч × учасник) пропускаються.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Замість плейсхолдера встав один реальний UUID матчу (без шпальт):
DO $$
DECLARE
  mid uuid NOT NULL := '00000000-0000-0000-0000-000000000000'::uuid; -- <-- змінити на UUID з URL організатора
  inst_id    uuid;
  org_id     uuid;
  sid1       uuid;
  sid2       uuid;
  v_pw       text;
  extra_uid  uuid;
  extra_em   text;
  extra_slot int;
  div_roll   CONSTANT text[] := ARRAY['Modified', 'Standard', 'Classic', 'Production'];
BEGIN
  IF mid = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Set «mid» in this script to your match UUID (from URL /matches/my/<id>/..., not the zero uuid).';
  END IF;

  SELECT organizer_id INTO org_id FROM public.matches WHERE id = mid;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'No match row for id %', mid;
  END IF;

  SELECT id INTO inst_id FROM auth.instances ORDER BY id LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  v_pw := crypt('SeedOnly_ChangeMe_9', gen_salt('bf'));

  SELECT id INTO sid1 FROM public.match_squads WHERE match_id = mid AND squad_phase = 'main' ORDER BY sort_order ASC LIMIT 1;

  SELECT id INTO sid2 FROM public.match_squads WHERE match_id = mid AND squad_phase = 'main' ORDER BY sort_order ASC OFFSET 1 LIMIT 1;

  IF sid1 IS NULL THEN
    RAISE EXCEPTION 'Match % has no main squads; save match card after planned squad counts or run organizer_sync.', mid;
  END IF;

  IF sid2 IS NULL THEN
    RAISE EXCEPTION 'Match % needs at least 2 main squads for this 4+4 script (planned_main_squad_count ≥ 2, then Save).', mid;
  END IF;

  FOR extra_slot IN 1..4 LOOP
    extra_em := format('stagebuilder.seed.extra.main1.u%s@local.test', extra_slot);
    SELECT id INTO extra_uid FROM auth.users WHERE email = extra_em LIMIT 1;

    IF extra_uid IS NULL THEN
      extra_uid := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
      )
      VALUES (
        extra_uid, inst_id, 'authenticated', 'authenticated', extra_em, v_pw, now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        now(), now(), false, false
      );
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(), extra_uid, extra_uid::text,
        jsonb_build_object('sub', extra_uid::text, 'email', extra_em),
        'email', now(), now(), now()
      );
    END IF;

    INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
    VALUES (extra_uid, format('Іваненко Тарас (Скв. 1 №%s)', extra_slot), 'pending')
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();

    IF NOT EXISTS (
      SELECT 1 FROM public.match_registrations WHERE match_id = mid AND competitor_user_id = extra_uid
    ) THEN
      INSERT INTO public.match_registrations (
        match_id, squad_id, competitor_user_id, division, classification_grade, power_factor, categories,
        status, payment_note, confirmed_at, confirmed_by
      )
      VALUES (
        mid, sid1, extra_uid, div_roll[extra_slot], 'U',
        CASE WHEN extra_slot IN (2, 4) THEN 'MINOR' ELSE 'MAJOR' END,
        '[]'::jsonb, 'confirmed',
        'seed: board testers attach script', now(), org_id
      );
    END IF;
  END LOOP;

  FOR extra_slot IN 1..4 LOOP
    extra_em := format('stagebuilder.seed.extra.main2.u%s@local.test', extra_slot);
    SELECT id INTO extra_uid FROM auth.users WHERE email = extra_em LIMIT 1;

    IF extra_uid IS NULL THEN
      extra_uid := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
      )
      VALUES (
        extra_uid, inst_id, 'authenticated', 'authenticated', extra_em, v_pw, now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        now(), now(), false, false
      );
      INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (
        gen_random_uuid(), extra_uid, extra_uid::text,
        jsonb_build_object('sub', extra_uid::text, 'email', extra_em),
        'email', now(), now(), now()
      );
    END IF;

    INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
    VALUES (extra_uid, format('Коваль Марія (Скв. 2 №%s)', extra_slot), 'pending')
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();

    IF NOT EXISTS (
      SELECT 1 FROM public.match_registrations WHERE match_id = mid AND competitor_user_id = extra_uid
    ) THEN
      INSERT INTO public.match_registrations (
        match_id, squad_id, competitor_user_id, division, classification_grade, power_factor, categories,
        status, payment_note, confirmed_at, confirmed_by
      )
      VALUES (
        mid, sid2, extra_uid, div_roll[extra_slot], 'B',
        CASE WHEN extra_slot IN (2, 4) THEN 'MINOR' ELSE 'MAJOR' END,
        '["Lady"]'::jsonb, 'confirmed',
        'seed: board testers attach script', now(), org_id
      );
    END IF;
  END LOOP;

  UPDATE public.matches
  SET participant_list_visibility = 'open', updated_at = now()
  WHERE id = mid;

  RAISE NOTICE 'Board testers attached to match_id = % (squads %, %).', mid, sid1, sid2;
END $$;
