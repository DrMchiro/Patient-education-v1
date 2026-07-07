// Pure functions describing patient progression. No I/O here — the API layer
// (src/lib/api.js) is responsible for persisting whatever these return.

export const PHASE_ORDER = ['Foundations', 'Building', 'Mastery'];

// Phase is driven by how many core videos a patient has watched (their
// "visit count" through the core sequence), not by calendar time or by how
// many core videos actually exist in the library. Visits 1-4 -> Foundations,
// 5-12 -> Building, 13+ -> Mastery, per the practice's stated model.
const PHASE_START_POSITION = { Foundations: 0, Building: 4, Mastery: 12 };

export function phaseForCorePosition(corePosition) {
  if (corePosition < PHASE_START_POSITION.Building) return 'Foundations';
  if (corePosition < PHASE_START_POSITION.Mastery) return 'Building';
  return 'Mastery';
}

export function phaseStartPosition(phase) {
  return PHASE_START_POSITION[phase];
}

export function currentPhaseOf(patient) {
  return phaseForCorePosition(patient.core_position);
}

// coreSequence: array of library rows with is_core=true, sorted by core_sequence asc.
export function getNextForPatient(patient, coreSequence) {
  if (patient.queue.length > 0) {
    return { id: patient.queue[0], fromQueue: true };
  }
  if (patient.core_position < coreSequence.length) {
    return { id: coreSequence[patient.core_position].id, fromQueue: false };
  }
  return null;
}

export function getLastForPatient(history) {
  return history.length ? history[history.length - 1] : null;
}

// Returns { badgeInfo, historyEntry, patientPatch } describing what changed
// after a video finishes. Caller persists patientPatch and inserts historyEntry.
export function computeCompletion(patient, nowPlaying, coreSequenceLength) {
  const { id: videoId, fromQueue } = nowPlaying;
  let badgeInfo = null;
  const patch = {};

  if (fromQueue) {
    patch.queue = patient.queue.slice(1);
  } else {
    const oldPhase = phaseForCorePosition(patient.core_position);
    const newPosition = patient.core_position + 1;
    const newPhase = phaseForCorePosition(newPosition);
    if (newPhase !== oldPhase) badgeInfo = { phase: oldPhase, isFinalPhase: newPosition >= coreSequenceLength };
    patch.core_position = newPosition;
  }

  return {
    badgeInfo,
    historyEntry: { video_id: videoId, added_by_doctor: fromQueue },
    patientPatch: patch,
  };
}

function scheduledConditionMet(patient, sched, coreSequenceLength, historyCount) {
  if (sched.type === 'phase') {
    const curPhase = currentPhaseOf(patient);
    return PHASE_ORDER.indexOf(curPhase) >= PHASE_ORDER.indexOf(sched.value);
  }
  if (sched.type === 'visit') {
    return historyCount >= sched.value;
  }
  if (sched.type === 'end') {
    return patient.core_position >= coreSequenceLength;
  }
  return false;
}

// Returns { queueAdditions: [videoId...], remainingScheduled: [...] }
export function resolveScheduledItems(patient, coreSequenceLength, historyCount) {
  const queueAdditions = [];
  const remainingScheduled = [];
  for (const sched of patient.scheduled) {
    if (scheduledConditionMet(patient, sched, coreSequenceLength, historyCount)) {
      queueAdditions.push(...sched.video_ids);
    } else {
      remainingScheduled.push(sched);
    }
  }
  return { queueAdditions, remainingScheduled };
}

// choice: 'next' | 'Foundations' | 'Building' | 'Mastery' | 'end' | { custom: visitsFromNow }
// Returns { queueAdditions: [videoId...] } or { scheduledAddition: {...} }
export function applyTimingChoice(choice, videoIds, label, patient, coreSequenceLength, historyCount) {
  if (choice === 'next') {
    return { queueAdditions: videoIds };
  }
  if (typeof choice === 'object' && choice.custom) {
    return {
      scheduledAddition: {
        type: 'visit',
        value: historyCount + choice.custom,
        label: `${label} — in ${choice.custom} visit${choice.custom > 1 ? 's' : ''}`,
        video_ids: videoIds,
      },
    };
  }
  if (choice === 'end') {
    if (patient.core_position >= coreSequenceLength) return { queueAdditions: videoIds };
    return { scheduledAddition: { type: 'end', value: null, label: `${label} — At the end`, video_ids: videoIds } };
  }
  // phase choice: Foundations / Building / Mastery
  const curPhase = currentPhaseOf(patient);
  const alreadyThere = PHASE_ORDER.indexOf(curPhase) >= PHASE_ORDER.indexOf(choice);
  if (alreadyThere) return { queueAdditions: videoIds };
  return { scheduledAddition: { type: 'phase', value: choice, label: `${label} — ${choice}`, video_ids: videoIds } };
}

// Groups core library rows (sorted by core_sequence) into contiguous
// topic blocks for the doctor's reorder roadmap bar.
export function buildTopicBlocks(coreSequence) {
  const blocks = [];
  for (const video of coreSequence) {
    const last = blocks[blocks.length - 1];
    if (last && last.topic === video.topic) {
      last.videoIds.push(video.id);
    } else {
      blocks.push({ topic: video.topic, videoIds: [video.id] });
    }
  }
  return blocks;
}

export function remainingCountFor(patient, coreSequenceLength) {
  return (
    Math.max(coreSequenceLength - patient.core_position, 0) +
    patient.queue.length +
    patient.scheduled.reduce((sum, s) => sum + s.video_ids.length, 0)
  );
}
