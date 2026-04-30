-- Match admin: test seed data (Supabase SQL Editor, role: postgres)
--
-- Prerequisites: extension pgcrypto; migrations through match squad sync /
-- organizer roster RPC (`20260506140000_*`, `20260506141000_*`).
-- If auth.users is empty, creates two users + identities; otherwise uses first/last user by created_at.
-- Re-run safe: skips when title "Seed: Test shotgun match" already exists.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  inst_id       uuid;
  org_id        uuid;
  comp_id       uuid;
  mid           uuid;
  sid1          uuid;
  sid2          uuid;
  user_count    int;
  seed_md_email constant text := 'stagebuilder.seed.md@local.test';
  seed_sh_email constant text := 'stagebuilder.seed.shooter@local.test';
  v_pw          text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.matches WHERE title = 'Seed: Test shotgun match') THEN
    RAISE NOTICE 'Seed skipped: match "Seed: Test shotgun match" already exists. DELETE that row to re-seed.';
    RETURN;
  END IF;

  SELECT id INTO inst_id FROM auth.instances ORDER BY id LIMIT 1;
  IF inst_id IS NULL THEN
    inst_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  SELECT count(*)::int INTO user_count FROM auth.users;

  IF user_count = 0 THEN
    v_pw := crypt('SeedOnly_ChangeMe_9', gen_salt('bf'));

    org_id := gen_random_uuid();
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
      org_id,
      inst_id,
      'authenticated',
      'authenticated',
      seed_md_email,
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
      org_id,
      org_id::text,
      jsonb_build_object('sub', org_id::text, 'email', seed_md_email),
      'email',
      now(),
      now(),
      now()
    );

    comp_id := gen_random_uuid();
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
      comp_id,
      inst_id,
      'authenticated',
      'authenticated',
      seed_sh_email,
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
      comp_id,
      comp_id::text,
      jsonb_build_object('sub', comp_id::text, 'email', seed_sh_email),
      'email',
      now(),
      now(),
      now()
    );

    RAISE NOTICE 'Created seed auth users: % (MD), % (shooter). Password: SeedOnly_ChangeMe_9', seed_md_email, seed_sh_email;

  ELSE
    SELECT id INTO org_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF org_id IS NULL THEN
      RAISE EXCEPTION 'auth.users count > 0 but no id returned (unexpected)';
    END IF;

    SELECT id INTO comp_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    IF comp_id IS NULL THEN
      comp_id := org_id;
    END IF;
  END IF;

  INSERT INTO public.match_admin_profiles (user_id, display_name, organizer_status)
  VALUES (org_id, 'Test MD (seed)', 'active')
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    organizer_status = 'active',
    updated_at = now();

  -- After migration 20260502140000_platform_match_organizers: seed org can open /{locale}/admin/organizers
  INSERT INTO public.portal_platform_admins (user_id)
  VALUES (org_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.matches (
    organizer_id,
    title,
    description_md,
    starts_at,
    location_label,
    location_lat,
    location_lng,
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
    org_id,
    'Seed: Test shotgun match',
    'Тестовий матч. Оплата поза платформою (seed).',
    (now() AT TIME ZONE 'utc') + interval '14 days',
    'Test range (seed)',
    50.44215,
    30.20449,
    'shotgun',
    'uspsa_p',
    'ipsc',
    'open',
    'published',
    false,
    2,
    0,
    12,
    18
  )
  RETURNING id INTO mid;

  PERFORM public.organizer_sync_match_squads_internal(mid);

  SELECT id INTO sid1 FROM public.match_squads WHERE match_id = mid AND squad_phase = 'main' ORDER BY sort_order ASC LIMIT 1;

  SELECT id INTO sid2 FROM public.match_squads WHERE match_id = mid AND squad_phase = 'main' ORDER BY sort_order ASC OFFSET 1 LIMIT 1;

  IF sid1 IS NULL OR sid2 IS NULL THEN
    RAISE EXCEPTION 'Seed squad sync failed for match % (expected 2 main squads)', mid;
  END IF;

  INSERT INTO public.match_registrations (
    match_id,
    squad_id,
    competitor_user_id,
    division,
    classification_grade,
    power_factor,
    categories,
    status
  )
  VALUES (
    mid,
    sid1,
    comp_id,
    'Modified',
    'U',
    'MAJOR',
    '["Lady","Junior"]'::jsonb,
    'pending'
  );

  IF org_id IS DISTINCT FROM comp_id THEN
    INSERT INTO public.match_registrations (
      match_id,
      squad_id,
      competitor_user_id,
      division,
      classification_grade,
      power_factor,
      categories,
      status
    )
    VALUES (
      mid,
      sid2,
      org_id,
      'Standard',
      'B',
      'MINOR',
      '[]'::jsonb,
      'pending'
    );
  END IF;

  UPDATE public.match_registrations
  SET
    status = 'confirmed',
    payment_note = 'seed: готівка / тест',
    confirmed_at = now(),
    confirmed_by = org_id
  WHERE match_id = mid
    AND competitor_user_id = comp_id
    AND status = 'pending';

  RAISE NOTICE 'seed match_id = %, squads = %, %', mid, sid1, sid2;
END $$;

-- Optional: link first published shared stage to this match (if any)
/*
INSERT INTO public.match_stage_links (match_id, sort_order, share_stage_id, snapshot_meta)
SELECT m.id, 0, s.id, '{}'::jsonb
FROM public.matches m
CROSS JOIN (SELECT id FROM public.shared_stages ORDER BY created_at DESC LIMIT 1) s
WHERE m.title = 'Seed: Test shotgun match'
ON CONFLICT DO NOTHING;
*/

-- Cleanup (run manually to remove seed data)
/*
DELETE FROM public.matches WHERE title = 'Seed: Test shotgun match';
-- Optional: remove auto-created demo users only if unused elsewhere:
-- DELETE FROM auth.users WHERE email IN (
--   'stagebuilder.seed.md@local.test',
--   'stagebuilder.seed.shooter@local.test'
-- );
*/
