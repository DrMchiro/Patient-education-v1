-- ============================================================================
-- DEMO / STRESS-TEST DATA — NOT REAL CONTENT, NOT REAL PATIENTS
--
-- This app has no live clinical deployment yet. This seed exists purely to
-- stress-test the UX and progression logic end to end (all three phases,
-- doctor reorder/schedule, queue, specialty series) without needing to
-- hand-enter rows in the Supabase Table Editor first.
--
-- Every "video" below points at the same real, public, ~19-second YouTube
-- clip (jNQXAC9IVRw — "Me at the zoo", the first video ever uploaded to
-- YouTube, April 2005). It's used deliberately: it's short, permanently
-- public, and obviously not a chiropractic education video, so nobody can
-- mistake playback during testing for real content. Before any real use,
-- replace every youtube_id below with your actual unlisted video IDs via
-- the Supabase Table Editor (see README.md).
--
-- Every demo patient name is prefixed "[DEMO]" for the same reason — so
-- they're unmistakable in the doctor view's search/select list.
-- ============================================================================

insert into specialty_series (key, name, sort_order) values
  ('migraine',  'Migraine Series',  1),
  ('pregnancy', 'Pregnancy Series', 2),
  ('sciatica',  'Sciatica Series',  3)
on conflict (key) do nothing;

-- Core sequence: 15 videos total, matching the phase thresholds exactly so
-- every phase is actually reachable in a stress test —
-- Foundations = positions 0-3 (Stress, 4 videos)
-- Building    = positions 4-11 (Nervous System + Posture, 8 videos)
-- Mastery     = positions 12-14 (Recovery, 3 videos)
insert into library (topic, title, youtube_id, is_core, core_sequence, topic_block) values
  ('Stress',         'What Is Chemical Stress? [DEMO]',       'jNQXAC9IVRw', true, 0,  0),
  ('Stress',         'Physical Stress & Your Spine [DEMO]',   'jNQXAC9IVRw', true, 1,  0),
  ('Stress',         'Emotional Stress and Healing [DEMO]',   'jNQXAC9IVRw', true, 2,  0),
  ('Stress',         'Managing Daily Stress Load [DEMO]',     'jNQXAC9IVRw', true, 3,  0),
  ('Nervous System', 'How Your Nervous System Works [DEMO]',  'jNQXAC9IVRw', true, 4,  1),
  ('Nervous System', 'Fight, Flight & Adjustment [DEMO]',     'jNQXAC9IVRw', true, 5,  1),
  ('Nervous System', 'The Vagus Nerve, Explained [DEMO]',     'jNQXAC9IVRw', true, 6,  1),
  ('Nervous System', 'Adaptation Over Time [DEMO]',           'jNQXAC9IVRw', true, 7,  1),
  ('Posture',        'Everyday Posture Habits [DEMO]',        'jNQXAC9IVRw', true, 8,  2),
  ('Posture',        'Desk Setup & Your Spine [DEMO]',        'jNQXAC9IVRw', true, 9,  2),
  ('Posture',        'Posture and Breathing [DEMO]',          'jNQXAC9IVRw', true, 10, 2),
  ('Posture',        'Building Better Habits [DEMO]',         'jNQXAC9IVRw', true, 11, 2),
  ('Recovery',       'What Long-Term Care Looks Like [DEMO]', 'jNQXAC9IVRw', true, 12, 3),
  ('Recovery',       'Maintenance vs. Correction [DEMO]',     'jNQXAC9IVRw', true, 13, 3),
  ('Recovery',       'Staying Ahead of Flare-Ups [DEMO]',     'jNQXAC9IVRw', true, 14, 3);

insert into library (topic, title, youtube_id, is_core, specialty_key, specialty_sequence) values
  ('Migraine',  'Understanding Migraine Triggers [DEMO]',    'jNQXAC9IVRw', false, 'migraine',  0),
  ('Migraine',  'Chiropractic Care & Migraine Relief [DEMO]','jNQXAC9IVRw', false, 'migraine',  1),
  ('Pregnancy', 'Chiropractic Care During Pregnancy [DEMO]', 'jNQXAC9IVRw', false, 'pregnancy', 0),
  ('Pregnancy', 'Preparing Your Body for Birth [DEMO]',      'jNQXAC9IVRw', false, 'pregnancy', 1),
  ('Sciatica',  'What Causes Sciatica? [DEMO]',              'jNQXAC9IVRw', false, 'sciatica',  0),
  ('Sciatica',  'Relief Strategies for Sciatica [DEMO]',     'jNQXAC9IVRw', false, 'sciatica',  1);

-- Demo patients spanning every state worth stress-testing: fresh, each
-- phase boundary, doctor-inserted queue items, and a scheduled item.
insert into patients (code, name, core_position, queue, scheduled) values
  ('0001', '[DEMO] Fresh Start',           0,  '[]', '[]'),
  ('0002', '[DEMO] Early Foundations',     1,  '[]', '[]'),
  ('0003', '[DEMO] Foundations Complete',  4,  '[]', '[]'),
  ('0004', '[DEMO] Mid Building',          8,  '[]', '[]'),
  ('0005', '[DEMO] Building Complete',     12, '[]', '[]'),
  ('0006', '[DEMO] Mastery In Progress',   13, '[]', '[]'),
  ('0007', '[DEMO] All Core Done',         15, '[]', '[]'),
  ('0008', '[DEMO] Has Doctor Queue',      3,
    (select jsonb_agg(id) from library where core_sequence = 5), '[]'),
  ('0009', '[DEMO] Has Scheduled Item',    2, '[]',
    jsonb_build_array(jsonb_build_object(
      'type', 'phase', 'value', 'Building',
      'label', 'Migraine Series — Building',
      'video_ids', (select jsonb_agg(id) from library where specialty_key = 'migraine')
    )))
on conflict (code) do nothing;

-- Back-fill watch history for each demo patient up to their core_position,
-- spaced a week apart working backwards from today.
do $$
declare
  pat record;
  vid record;
  days_ago int;
begin
  for pat in select code, core_position from patients where code like '000%'
  loop
    days_ago := pat.core_position * 7;
    for vid in
      select id from library
      where is_core = true and core_sequence < pat.core_position
      order by core_sequence asc
    loop
      insert into history (patient_code, video_id, watched_at, added_by_doctor)
      values (pat.code, vid.id, now() - (days_ago || ' days')::interval, false);
      days_ago := greatest(days_ago - 7, 0);
    end loop;
  end loop;
end $$;
