-- Patient Education Kiosk — schema
-- Run this once in the Supabase SQL editor for a new project.

create table if not exists specialty_series (
  key        text primary key,
  name       text not null,
  sort_order int  not null default 0
);

create table if not exists library (
  id                serial primary key,
  topic             text not null,
  title             text not null,
  youtube_id        text not null,
  is_core           boolean not null default false,
  -- order within the core sequence (0-based). Null for non-core videos.
  core_sequence     int,
  -- groups consecutive core videos into a topic block for the doctor's
  -- reorder roadmap bar (e.g. all 3 "Stress" videos share block 0).
  topic_block       int,
  specialty_key     text references specialty_series(key),
  specialty_sequence int,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists library_core_idx on library (is_core, core_sequence) where is_core;
create index if not exists library_specialty_idx on library (specialty_key, specialty_sequence);

create table if not exists patients (
  code          text primary key,
  name          text,
  core_position int not null default 0,
  -- ordered array of library.id — doctor-inserted, takes priority over core sequence
  queue         jsonb not null default '[]'::jsonb,
  -- array of { type: 'phase'|'visit'|'end', value, label, video_ids: [] }
  scheduled     jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create table if not exists history (
  id              bigserial primary key,
  patient_code    text not null references patients(code) on delete cascade,
  video_id        int not null references library(id),
  watched_at      timestamptz not null default now(),
  added_by_doctor boolean not null default false
);

create index if not exists history_patient_idx on history (patient_code, watched_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This app has no per-user login: the kiosk and the doctor view both connect
-- with the public "anon" key, and the doctor view is gated only by a shared
-- PIN checked in the browser. That PIN is a workflow gate, not a security
-- boundary — anyone with the anon key can call these tables directly.
-- That's an acceptable tradeoff for a practice-internal kiosk on a private
-- network, but do not put anything more sensitive than "watched video X on
-- date Y" in these tables. If that changes, put a real auth layer in front
-- of this instead of relying on RLS here.
-- ---------------------------------------------------------------------------

alter table specialty_series enable row level security;
alter table library enable row level security;
alter table patients enable row level security;
alter table history enable row level security;

create policy "anon read specialty_series" on specialty_series for select to anon using (true);
create policy "anon read library" on library for select to anon using (true);

create policy "anon read patients" on patients for select to anon using (true);
create policy "anon update patients" on patients for update to anon using (true) with check (true);
create policy "anon insert patients" on patients for insert to anon with check (true);

create policy "anon read history" on history for select to anon using (true);
create policy "anon insert history" on history for insert to anon with check (true);

-- Library content is intentionally NOT writable by the anon key. To add or
-- change a video, edit the `library` table directly in the Supabase Table
-- Editor (Project -> Table Editor -> library) — no code change or app
-- deploy required. This keeps content edits safe from anything running in
-- a patient-facing browser tab.

-- ---------------------------------------------------------------------------
-- complete_video: atomically logs a watched video and applies whatever state
-- change it causes (advance core_position, or pop the queue; plus any
-- scheduled items that just became due). Keeps the history insert and the
-- patient row update from ever landing half-done if the kiosk loses network
-- mid-write.
-- ---------------------------------------------------------------------------
create or replace function complete_video(
  p_code text,
  p_video_id int,
  p_added_by_doctor boolean,
  p_new_core_position int,   -- pass current value if unchanged
  p_new_queue jsonb,         -- pass current value if unchanged
  p_new_scheduled jsonb      -- pass current value if unchanged
) returns void as $$
begin
  insert into history (patient_code, video_id, added_by_doctor)
    values (p_code, p_video_id, p_added_by_doctor);

  update patients set
    core_position = p_new_core_position,
    queue = p_new_queue,
    scheduled = p_new_scheduled
  where code = p_code;
end;
$$ language plpgsql security definer;

grant execute on function complete_video(text, int, boolean, int, jsonb, jsonb) to anon;
