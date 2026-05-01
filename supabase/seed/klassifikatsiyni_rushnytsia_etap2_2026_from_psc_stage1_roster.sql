-- Roster import: PractiScore export «Класифікаційні … 1етап 2026р.» → портал «Етап 2».
--
-- У вихідному `.psc` (match_def.json) було **5** стрільців; усі `sh_sqd = 0` — поділу на скводи в PS не було,
-- тому тут **один main-сквод** на всіх (як одна група). Вправи в матч **не** додаються — лише матч + сквод + заявки.
--
-- Виконувати в **Supabase SQL Editor** під роллю **postgres** (або `npx supabase db query --linked -f ...`).
-- Пароль для нових акаунтів стрільців: **ImportPsc_Etap2_ChangeMe_9** (змініть після імпорту).
--
-- Організатор:
--   У блоці `DECLARE` встановіть **`v_org_id`** на свій `auth.users.id` (власник матчу, `organizer_status = active`),
--   або залиште **NULL** — візьметься перший користувач з `match_admin_profiles` у статусі **active** (обережно на спільних проєктах).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_org_id        uuid := NULL; -- напр. 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid;
  v_title         constant text := 'Класифікаційні Змагання З Практичної Стрільби З Рушниці Етап 2 2026р.';
  inst_id         uuid;
  mid             uuid;
  sid1            uuid;
  v_pw            text;
  i               int;
  uid             uuid;
  v_emails        text[] := ARRAY[
    'klassif-rush-2026-e2.p1@local.psc-import.test',
    'klassif-rush-2026-e2.p2@local.psc-import.test',
    'klassif-rush-2026-e2.p3@local.psc-import.test',
    'klassif-rush-2026-e2.p4@local.psc-import.test',
    'klassif-rush-2026-e2.p5@local.psc-import.test'
  ];
  v_last          text[] := ARRAY['Паршенцев', 'Паршенцева', 'Єгурнов', 'Фалюш', 'Караган'];
  v_first         text[] := ARRAY['Денис', 'Єлизавета', 'Олександр', 'Сергій', 'Олексій'];
  v_div           text[] := ARRAY['Modified', 'Standard', 'Modified', 'Standard', 'Standard'];
  v_cats          jsonb[] := ARRAY[
    '[]'::jsonb,
    '["Lady Junior","Lady","Junior"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '["Senior"]'::jsonb
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM public.matches WHERE title = v_title) THEN
    RAISE NOTICE 'Skipped: match "%" already exists.', v_title;
    RETURN;
  END IF;

  IF v_org_id IS NULL THEN
    SELECT user_id
    INTO v_org_id
    FROM public.match_admin_profiles
    WHERE organizer_status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Set v_org_id to your organizer user UUID, or create an active match_admin_profiles row.';
  END IF;

  SELECT id INTO inst_id FROM auth.instances ORDER BY id LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  v_pw := crypt('ImportPsc_Etap2_ChangeMe_9', gen_salt('bf'));

  INSERT INTO public.matches (
    organizer_id,
    title,
    description_md,
    starts_at,
    location_label,
    discipline,
    ps_match_type,
    ps_match_subtype,
    participant_list_visibility,
    status,
    prematch_enabled,
    planned_main_squad_count,
    planned_prematch_squad_count,
    shooters_per_main_squad,
    shooters_per_prematch_squad
  )
  VALUES (
    v_org_id,
    v_title,
    'Імпорт ростеру з PractiScore (етап 1, 2026). Вправи додаються окремо в організаторській картці матчу.',
    timestamptz '2026-05-17 09:00:00+03',
    'Місце уточнюється',
    'shotgun',
    'uspsa_p',
    'ipsc',
    'open',
    'published',
    false,
    1,
    0,
    8,
    18
  )
  RETURNING id INTO mid;

  PERFORM public.organizer_sync_match_squads_internal(mid);

  SELECT id INTO sid1
  FROM public.match_squads
  WHERE match_id = mid AND squad_phase = 'main'
  ORDER BY sort_order ASC
  LIMIT 1;

  IF sid1 IS NULL THEN
    RAISE EXCEPTION 'Squad sync failed for match %', mid;
  END IF;

  FOR i IN 1..array_length(v_emails, 1) LOOP
    SELECT id INTO uid FROM auth.users WHERE email = v_emails[i] LIMIT 1;

    IF uid IS NULL THEN
      uid := gen_random_uuid();
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
        uid,
        inst_id,
        'authenticated',
        'authenticated',
        v_emails[i],
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
        uid,
        uid::text,
        jsonb_build_object('sub', uid::text, 'email', v_emails[i]),
        'email',
        now(),
        now(),
        now()
      );
    END IF;

    INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
    VALUES (
      uid,
      trim(v_last[i]) || ' ' || trim(v_first[i]),
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
      sid1,
      uid,
      v_div[i],
      '',
      'MAJOR',
      v_cats[i],
      'confirmed',
      'Імпорт з PSC (етап 1); підтверджено при заведенні.',
      now(),
      v_org_id
    );
  END LOOP;

  RAISE NOTICE 'Created match «%» (id=%) with 5 confirmed registrations on one main squad. Shooter password: ImportPsc_Etap2_ChangeMe_9', v_title, mid;
END $$;
