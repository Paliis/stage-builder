-- Match admin: test seed data (Supabase SQL Editor, role: postgres)
-- Prerequisites: at least one user in Authentication; shared_stages optional.
-- Safe to re-run only on empty test project — uses fixed title match; see bottom for cleanup.

DO $$
DECLARE
  org_id  uuid;
  comp_id uuid;
  mid     uuid;
  sid1    uuid;
  sid2    uuid;
BEGIN
  SELECT id INTO org_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'auth.users is empty: create a user via Auth UI or your app first';
  END IF;

  SELECT id INTO comp_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  IF comp_id IS NULL THEN
    comp_id := org_id;
  END IF;

  INSERT INTO public.match_admin_profiles (user_id, display_name)
  VALUES (org_id, 'Test MD (seed)')
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();

  INSERT INTO public.matches (
    organizer_id,
    title,
    description_md,
    starts_at,
    location_label,
    location_lat,
    location_lng,
    competitor_limit,
    discipline,
    ps_match_type,
    ps_match_subtype,
    status
  )
  VALUES (
    org_id,
    'Seed: Test shotgun match',
    'Тестовий матч. Оплата поза платформою (seed).',
    (now() AT TIME ZONE 'utc') + interval '14 days',
    'Test range (seed)',
    50.44215,
    30.20449,
    32,
    'shotgun',
    'uspsa_p',
    'ipsc',
    'published'
  )
  RETURNING id INTO mid;

  INSERT INTO public.match_squads (match_id, label, sort_order, squad_starts_at, capacity)
  VALUES (
    mid,
    'Сквод 1',
    0,
    (now() AT TIME ZONE 'utc') + interval '14 days' + interval '8 hours',
    12
  )
  RETURNING id INTO sid1;

  INSERT INTO public.match_squads (match_id, label, sort_order, squad_starts_at, capacity)
  VALUES (
    mid,
    'Сквод 2',
    1,
    (now() AT TIME ZONE 'utc') + interval '14 days' + interval '10 hours',
    12
  )
  RETURNING id INTO sid2;

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
*/
