-- Extra published matches for match hub UI preview (calendar + list).
-- Safe re-run: skips if any row with title like 'Demo hub:%' exists.
-- Requires an organizer: first published match organizer, else active match_admin_profiles.
-- Apply: npm run supabase:seed:match-hub-demos (linked project) or SQL Editor as postgres.

DO $$
DECLARE
  org_id     uuid;
  new_id     uuid;
  base_start timestamptz;
BEGIN
  IF EXISTS (SELECT 1 FROM public.matches WHERE title LIKE 'Demo hub:%' LIMIT 1) THEN
    RAISE NOTICE 'Seed skipped: Demo hub:* matches already exist. DELETE WHERE title LIKE ''Demo hub:%%'' to re-run.';
    RETURN;
  END IF;

  SELECT organizer_id
    INTO org_id
  FROM public.matches
  WHERE status = 'published'
  ORDER BY starts_at ASC NULLS LAST
  LIMIT 1;

  IF org_id IS NULL THEN
    SELECT user_id
      INTO org_id
    FROM public.match_admin_profiles
    WHERE organizer_status = 'active'
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF org_id IS NULL THEN
    RAISE NOTICE 'Seed skipped: no published match and no active match_admin_profiles.organizer_status = active.';
    RETURN;
  END IF;

  base_start := date_trunc('day', now() AT TIME ZONE 'utc') AT TIME ZONE 'utc';

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
    shooters_per_prematch_squad,
    match_event_kind,
    ps_match_level
  )
  VALUES
    (
      org_id,
      'Demo hub: Київ — короткий тур',
      'Демо-подія для перегляду списку (seed).',
      base_start + interval '4 days' + interval '10 hours',
      'Київ, «Бустер»',
      50.4501,
      30.5234,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'match',
      'L2'
    ),
    (
      org_id,
      'Demo hub: Тренування PCC',
      'Демо (seed).',
      base_start + interval '6 days' + interval '9 hours',
      'Львів, стрільбище ВЦВМ',
      49.8397,
      24.0297,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      1,
      0,
      12,
      18,
      'training',
      'L1'
    ),
    (
      org_id,
      'Demo hub: Класифікація рушниця',
      'Демо (seed).',
      base_start + interval '11 days' + interval '8 hours',
      'Одеса, тактичний полігон',
      46.4825,
      30.7233,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      3,
      0,
      10,
      18,
      'classification',
      'L3'
    ),
    (
      org_id,
      'Demo hub: Харків cup',
      'Демо (seed).',
      base_start + interval '18 days' + interval '9 hours 30 minutes',
      'Харків',
      49.9935,
      36.2304,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      14,
      18,
      'match',
      'L3'
    ),
    (
      org_id,
      'Demo hub: Дніпро steel challenge',
      'Демо (seed).',
      base_start + interval '25 days' + interval '10 hours',
      'Дніпро',
      48.4647,
      35.0462,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'match',
      'L4'
    ),
    (
      org_id,
      'Demo hub: Тернопіль відкрита практика',
      'Демо (seed).',
      base_start + interval '33 days' + interval '14 hours',
      'Тернопіль',
      49.5535,
      25.5948,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      1,
      0,
      18,
      18,
      'training',
      'L2'
    ),
    (
      org_id,
      'Demo hub: Вінниця — комбайн',
      'Демо (seed).',
      base_start + interval '41 days' + interval '9 hours',
      'Вінниця',
      49.2331,
      28.4682,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'match',
      'L2'
    ),
    (
      org_id,
      'Demo hub: Запоріжжя серія',
      'Демо (seed).',
      base_start + interval '49 days' + interval '11 hours',
      'Запоріжжя',
      47.8388,
      35.1396,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'classification',
      'L1'
    ),
    (
      org_id,
      'Demo hub: Полтава express',
      'Демо (seed).',
      base_start + interval '58 days' + interval '10 hours 15 minutes',
      'Полтава',
      49.5883,
      34.5514,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'match',
      'L5'
    ),
    (
      org_id,
      'Demo hub: Черкаси закриття сезону',
      'Демо (seed).',
      base_start + interval '67 days' + interval '9 hours',
      'Черкаси',
      49.4444,
      32.0598,
      'shotgun',
      'uspsa_p',
      'ipsc',
      'open',
      'published',
      false,
      2,
      0,
      12,
      18,
      'match',
      'L4'
    );

  -- Squad rows + competitor_limit via organizer_sync_match_squads_internal.
  FOR new_id IN
    SELECT id FROM public.matches WHERE title LIKE 'Demo hub:%'
  LOOP
    PERFORM public.organizer_sync_match_squads_internal(new_id);
  END LOOP;

  RAISE NOTICE 'Inserted Demo hub matches for organizer %', org_id;
END;
$$;
