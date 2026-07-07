-- Optional demo/starter content — mirrors the original prototype's library
-- so you can see the app working end to end. Replace the youtube_id values
-- with your real unlisted YouTube video IDs (the part after v= in the URL),
-- and edit/delete rows in the Supabase Table Editor as your real content
-- library grows.

insert into specialty_series (key, name, sort_order) values
  ('migraine',  'Migraine Series',  1),
  ('pregnancy', 'Pregnancy Series', 2)
on conflict (key) do nothing;

insert into library (topic, title, youtube_id, is_core, core_sequence, topic_block) values
  ('Stress',         'What Is Chemical Stress?',      'REPLACE_ME_1', true, 0, 0),
  ('Stress',         'Physical Stress & Your Spine',  'REPLACE_ME_2', true, 1, 0),
  ('Stress',         'Emotional Stress and Healing',  'REPLACE_ME_3', true, 2, 0),
  ('Nervous System', 'How Your Nervous System Works', 'REPLACE_ME_4', true, 3, 1),
  ('Nervous System', 'Fight, Flight & Adjustment',     'REPLACE_ME_5', true, 4, 1);

insert into library (topic, title, youtube_id, is_core, specialty_key, specialty_sequence) values
  ('Migraine',  'Understanding Migraine Triggers',     'REPLACE_ME_6', false, 'migraine',  0),
  ('Migraine',  'Chiropractic Care & Migraine Relief',  'REPLACE_ME_7', false, 'migraine',  1),
  ('Pregnancy', 'Chiropractic Care During Pregnancy',  'REPLACE_ME_8', false, 'pregnancy', 0),
  ('Pregnancy', 'Preparing Your Body for Birth',        'REPLACE_ME_9', false, 'pregnancy', 1);

-- A couple of demo patients with 4-digit codes for testing the flow.
insert into patients (code, name, core_position) values
  ('0001', 'Demo Patient 1', 2),
  ('0002', 'Demo Patient 2', 0)
on conflict (code) do nothing;
