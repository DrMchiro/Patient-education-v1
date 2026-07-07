import { supabase } from '../supabaseClient';

// ---- library --------------------------------------------------------------

let libraryCache = null;
let libraryCacheAt = 0;
const LIBRARY_CACHE_MS = 60_000; // doctor edits in Supabase show up within a minute

export async function fetchLibraryData({ force = false } = {}) {
  if (!force && libraryCache && Date.now() - libraryCacheAt < LIBRARY_CACHE_MS) {
    return libraryCache;
  }

  const [{ data: videos, error: vErr }, { data: series, error: sErr }] = await Promise.all([
    supabase.from('library').select('*').eq('active', true),
    supabase.from('specialty_series').select('*').order('sort_order', { ascending: true }),
  ]);
  if (vErr) throw vErr;
  if (sErr) throw sErr;

  const byId = new Map(videos.map((v) => [v.id, v]));
  const coreSequence = videos
    .filter((v) => v.is_core)
    .sort((a, b) => a.core_sequence - b.core_sequence);

  const specialtySeriesList = series.map((s) => ({
    ...s,
    videos: videos
      .filter((v) => v.specialty_key === s.key)
      .sort((a, b) => a.specialty_sequence - b.specialty_sequence),
  }));

  libraryCache = { byId, coreSequence, specialtySeriesList };
  libraryCacheAt = Date.now();
  return libraryCache;
}

// ---- patients & history -----------------------------------------------------

export async function fetchPatient(code) {
  const { data, error } = await supabase.from('patients').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchHistory(code) {
  const { data, error } = await supabase
    .from('history')
    .select('*')
    .eq('patient_code', code)
    .order('watched_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAllPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select('code, name, core_position')
    .order('code', { ascending: true });
  if (error) throw error;
  return data;
}

export async function searchPatients(query) {
  const q = query.trim();
  if (!q) return fetchAllPatients();
  const { data, error } = await supabase
    .from('patients')
    .select('code, name, core_position')
    .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
    .order('code', { ascending: true })
    .limit(30);
  if (error) throw error;
  return data;
}

export async function updatePatientName(code, name) {
  const { error } = await supabase.from('patients').update({ name }).eq('code', code);
  if (error) throw error;
}

// Persists a completed video atomically: logs the history row and applies
// the resulting patient patch (advance core_position, or pop the queue) plus
// any scheduled items that just became due.
export async function completeVideo({ code, videoId, addedByDoctor, newCorePosition, newQueue, newScheduled }) {
  const { error } = await supabase.rpc('complete_video', {
    p_code: code,
    p_video_id: videoId,
    p_added_by_doctor: addedByDoctor,
    p_new_core_position: newCorePosition,
    p_new_queue: newQueue,
    p_new_scheduled: newScheduled,
  });
  if (error) throw error;
}

export async function updatePatientQueueAndScheduled(code, { queue, scheduled }) {
  const patch = {};
  if (queue !== undefined) patch.queue = queue;
  if (scheduled !== undefined) patch.scheduled = scheduled;
  const { error } = await supabase.from('patients').update(patch).eq('code', code);
  if (error) throw error;
}
