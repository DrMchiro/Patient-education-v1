import { useCallback, useEffect, useState } from 'react';
import { fetchLibraryData, fetchPatient, fetchHistory, completeVideo } from './lib/api';
import { getNextForPatient, computeCompletion, resolveScheduledItems } from './lib/businessLogic';
import { useInactivityTimer } from './lib/useInactivityTimer';
import KeypadScreen from './components/KeypadScreen';
import LookupScreen from './components/LookupScreen';
import PlayerScreen from './components/PlayerScreen';
import DoneScreen from './components/DoneScreen';
import DoctorPinScreen from './components/DoctorPinScreen';
import DoctorView from './components/DoctorView';
import DemoBanner from './components/DemoBanner';

const LOOKUP_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_LOOKUP || 60) * 1000;
const PLAYER_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_PLAYER || 120) * 1000;
const DOCTOR_TIMEOUT_MS = Number(import.meta.env.VITE_IDLE_TIMEOUT_DOCTOR || 180) * 1000;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export default function App() {
  const [screen, setScreen] = useState('keypad'); // keypad | lookup | player | done | doctor-pin | doctor
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState(null);

  const [code, setCode] = useState('');
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [codeError, setCodeError] = useState('');

  const [nowPlaying, setNowPlaying] = useState(null); // { id, fromQueue }
  const [badgeInfo, setBadgeInfo] = useState(null);

  useEffect(() => {
    fetchLibraryData()
      .then(setLibrary)
      .catch((e) => setLibraryError(e.message));
  }, []);

  const resetToKeypad = useCallback(() => {
    setCode('');
    setPatient(null);
    setHistory([]);
    setNowPlaying(null);
    setBadgeInfo(null);
    setCodeError('');
    setScreen('keypad');
  }, []);

  async function handleSubmitCode(enteredCode, clearInput) {
    setCodeError('');
    try {
      const p = await fetchPatient(enteredCode);
      if (!p) {
        setCodeError('Code not found — ask your CA');
        clearInput();
        return;
      }
      const h = await fetchHistory(enteredCode);
      setCode(enteredCode);
      setPatient(p);
      setHistory(h);
      setScreen('lookup');
    } catch (e) {
      console.error(e);
      setCodeError('Connection problem — try again');
      clearInput();
    }
  }

  function handleStartVideo() {
    if (!patient || !library) return;
    const next = getNextForPatient(patient, library.coreSequence);
    if (!next) return;
    setNowPlaying(next);
    setScreen('player');
  }

  // Idle mid-video: pause and reset without logging completion, so the same
  // unfinished video is what's served next time this code is entered.
  function handlePlayerAbandoned() {
    resetToKeypad();
  }

  async function handleVideoEnded() {
    if (!patient || !nowPlaying || !library) return;

    const { historyEntry, patientPatch, badgeInfo: badge } = computeCompletion(
      patient,
      nowPlaying,
      library.coreSequence.length
    );
    const patientAfterPatch = { ...patient, ...patientPatch };
    const historyCountAfter = history.length + 1;
    const { queueAdditions, remainingScheduled } = resolveScheduledItems(
      patientAfterPatch,
      library.coreSequence.length,
      historyCountAfter
    );
    const newQueue = [...(patientPatch.queue ?? patient.queue), ...queueAdditions];
    const newScheduled = remainingScheduled;
    const newCorePosition = patientPatch.core_position ?? patient.core_position;

    try {
      await completeVideo({
        code,
        videoId: historyEntry.video_id,
        addedByDoctor: historyEntry.added_by_doctor,
        newCorePosition,
        newQueue,
        newScheduled,
      });
    } catch (e) {
      console.error('Failed to persist completion, will resync on next code entry', e);
    }

    setPatient({ ...patient, core_position: newCorePosition, queue: newQueue, scheduled: newScheduled });
    setHistory([
      ...history,
      { video_id: historyEntry.video_id, added_by_doctor: historyEntry.added_by_doctor, watched_at: new Date().toISOString() },
    ]);
    setBadgeInfo(badge);
    setNowPlaying(null);
    setScreen('done');
  }

  useInactivityTimer(screen === 'lookup', LOOKUP_TIMEOUT_MS, resetToKeypad);
  useInactivityTimer(screen === 'player', PLAYER_TIMEOUT_MS, handlePlayerAbandoned);
  useInactivityTimer(screen === 'doctor' || screen === 'doctor-pin', DOCTOR_TIMEOUT_MS, resetToKeypad);

  if (libraryError) {
    return (
      <div id="app">
        {DEMO_MODE && <DemoBanner />}
        <div className="screen centered">
          <div className="prompt-title">Can&apos;t connect</div>
          <div className="prompt-sub">{libraryError}</div>
        </div>
      </div>
    );
  }

  if (!library) {
    return (
      <div id="app">
        {DEMO_MODE && <DemoBanner />}
        <div className="screen centered">
          <div className="loading-note">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      {DEMO_MODE && <DemoBanner />}
      {screen === 'keypad' && (
        <KeypadScreen onSubmitCode={handleSubmitCode} error={codeError} onOpenDoctorPin={() => setScreen('doctor-pin')} />
      )}
      {screen === 'lookup' && patient && (
        <LookupScreen
          code={code}
          patient={patient}
          history={history}
          library={library}
          onStartVideo={handleStartVideo}
          onBackToStart={resetToKeypad}
        />
      )}
      {screen === 'player' && nowPlaying && (
        <PlayerScreen video={library.byId.get(nowPlaying.id)} onEnded={handleVideoEnded} />
      )}
      {screen === 'done' && <DoneScreen badgeInfo={badgeInfo} onDone={resetToKeypad} />}
      {screen === 'doctor-pin' && <DoctorPinScreen onSuccess={() => setScreen('doctor')} onCancel={resetToKeypad} />}
      {screen === 'doctor' && <DoctorView library={library} onClose={resetToKeypad} />}
    </div>
  );
}
