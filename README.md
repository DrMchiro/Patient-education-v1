# Patient Education Kiosk

Waiting-room kiosk for a chiropractic practice: patients enter a 4-digit
code, watch a short YouTube video assigned to their stage of care, and the
system tracks progress automatically. Doctors reorder/schedule content
through a PIN-gated view. Built from `patient-education-kiosk.html`
prototype, re-architected around YouTube-hosted video and a real database
so a doctor's changes on one device reach the kiosk on another.

> **This is a stress-test build, not a live clinical deployment.** There is
> no real patient data or real video content in this repo — `supabase/seed.sql`
> is entirely demo data (see below), and the app shows a persistent
> "DEMO / TEST DATA" banner (`VITE_DEMO_MODE=true`) until that's turned off.
> The goal right now is to validate the UX and progression logic end to
> end, not to hold anything real.

## Stack

- **React + Vite** — single-page app, three patient screens + a doctor view,
  switched by local state rather than a router (this is a single always-open
  tab, not a multi-page site).
- **Supabase (Postgres)** — the database. Not local storage: a doctor
  reorders content from their own computer, and that change has to reach
  a kiosk tablet in a different room. Local storage can't cross devices;
  Postgres + Supabase's auto-generated REST API can, with almost no backend
  code to maintain.
- **YouTube IFrame Player API** — real video playback, completion detected
  via `onStateChange` reaching `YT.PlayerState.ENDED`, not a timer.

## One-time setup

1. Create a Supabase project (pick a region close to your practice, e.g.
   Sydney for NZ/AU).
2. In the Supabase SQL editor, run in order:
   - `supabase/schema.sql` — tables, RLS policies, the `complete_video`
     function.
   - `supabase/seed.sql` — demo content library and 9 demo patients
     covering every phase/queue/scheduled state, for stress-testing the
     flow end to end. All demo videos point at the same real, short,
     public YouTube clip so playback actually works during testing; all
     demo patient names are prefixed `[DEMO]`. Replace every `youtube_id`
     with your real unlisted video IDs, and delete the demo patients,
     before any real use.
   - `supabase/generate_codes.sql` — pre-provisions a pool of blank
     4-digit patient codes (see "Check-in workflow" below). Adjust the
     range before running in production.
3. Copy `.env.example` to `.env`, fill in your Supabase project URL/anon
   key (Project Settings → API), and set `VITE_STAFF_PIN` to your practice's
   shared doctor PIN. Leave `VITE_DEMO_MODE=true` while testing; set it to
   `false` once real content and real patients are in the database.
4. `npm install`
5. `npm run dev` for local development, `npm run build` to produce a
   static `dist/` you can host anywhere (Vercel/Netlify/Cloudflare Pages/S3
   — it's just static files, no server process required).

## Check-in workflow (zero staff action)

Rather than building a "create patient" screen, `generate_codes.sql`
pre-creates a batch of blank patient rows (e.g. codes `0001`–`0500`) ahead
of time. Print a physical card for each code and keep them in a stack at
reception. Handing a new patient the next card *is* the entire check-in
action — the row already exists, so the kiosk works the first time that
code is typed in. No CA screen, no digital step. When a doctor later wants
to attach a name to a code (for search convenience in the doctor view),
they can type it into the "Patient name" field the first time they select
that patient — this is optional and only for the doctor's own lookup, it
has no effect on the patient flow.

4-digit codes give 10,000 possible values, which will comfortably outlast
this practice's patient volume for years without needing to recycle codes.

## Editing the video library

The `library` table is intentionally **not** writable from the app (kiosk
or doctor view) — only readable. To add a video or swap a link:
open the Supabase Table Editor → `library` table → edit the `youtube_id`
column directly. No code change, no redeploy. This keeps content edits
safe from anything running in a patient-facing browser tab, while still
being a "simple admin field" a non-technical staff member (or you) can
use once shown where it is.

`specialty_series` groups specialty videos (e.g. "Migraine Series") for
the doctor's "Add series" panel — add a row there before adding videos
that reference its `key`.

## How phases work

Phase is driven purely by how many core videos a patient has watched
(`core_position`), not by library size or calendar time:
visits 1–4 = Foundations, 5–12 = Building, 13+ = Mastery. See
`src/lib/businessLogic.js` for the thresholds if these need to change.

## Player behavior

- Starts muted (autoplay-with-sound is blocked by most browsers regardless
  of prior interaction on a shared kiosk profile) with a persistent "tap to
  unmute" overlay rather than trying to detect whether unmuted autoplay
  would have worked.
- `rel=0`, `modestbranding=1`, `iv_load_policy=3`, `fs=0`, `disablekb=1` —
  minimizes related-video/branding chrome and disables the fullscreen
  button and keyboard shortcuts, since this is a kiosk, not a general
  YouTube experience.
- Completion is `onStateChange` → `YT.PlayerState.ENDED`. No timers.

## Resilience / kiosk chaos handling

- **Wrong code**: inline error, no lockout, "ask your CA" message.
- **Idle on the lookup screen** (patient walks off without pressing play):
  auto-resets to the code entry screen after `VITE_IDLE_TIMEOUT_LOOKUP`
  seconds (default 60).
- **Interrupted mid-video** (patient called into a room): idle timeout on
  the player screen (`VITE_IDLE_TIMEOUT_PLAYER`, default 120s) pauses and
  resets to code entry *without* logging completion — the same unfinished
  video is served again next time that code is entered. Videos restart
  from the beginning rather than resuming mid-point; for 1–2 minute clips
  this is a deliberate simplicity tradeoff, not an oversight.
- **Doctor view left open**: idle timeout (`VITE_IDLE_TIMEOUT_DOCTOR`,
  default 180s) auto-returns to the patient code screen so the kiosk isn't
  left sitting on a staff-only view (and doesn't require a doctor to
  remember to back out).
- **Doctor reorders mid-treatment-plan**: the kiosk always re-fetches
  patient state fresh when a code is entered, so there's no caching/sync
  issue to reason about — whatever the doctor last saved is what the
  patient sees next time they check in.
- **Completion write fails** (network hiccup at the exact moment a video
  ends): the UI still shows the "all done" screen locally so the patient
  isn't blocked, and state resyncs from the database next time that code
  is entered. `complete_video` is one atomic Postgres function, so a
  partial write (history logged but position not advanced, or vice versa)
  can't happen even under retry.

## Known limitation: no per-request auth

The kiosk and doctor view both use Supabase's public anon key; the doctor
PIN is a UI workflow gate, not a database-enforced security boundary —
anyone with the anon key can call these tables directly. That's an
acceptable tradeoff for a practice-internal kiosk on a private network
tracking nothing more sensitive than "watched video X on date Y." If this
system ever needs to hold more sensitive data, put real auth in front of
it rather than relying on RLS as it stands today.
