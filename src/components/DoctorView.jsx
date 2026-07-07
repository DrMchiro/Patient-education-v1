import { useEffect, useMemo, useState } from 'react';
import { fetchPatient, fetchHistory, updatePatientQueueAndScheduled, updatePatientName } from '../lib/api';
import { applyTimingChoice, buildTopicBlocks, remainingCountFor } from '../lib/businessLogic';
import PatientSearch from './PatientSearch';
import RoadmapBar from './RoadmapBar';
import ReorderPanel from './ReorderPanel';
import SeriesList from './SeriesList';
import QueueScheduledLists from './QueueScheduledLists';
import HistoryList from './HistoryList';

export default function DoctorView({ library, onClose }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [reorderActiveIdx, setReorderActiveIdx] = useState(null);
  const [nameDraft, setNameDraft] = useState('');
  const [banner, setBanner] = useState('');

  const topicBlocks = useMemo(() => buildTopicBlocks(library.coreSequence), [library.coreSequence]);

  function showBanner(text) {
    setBanner(text);
    setTimeout(() => setBanner(''), 3000);
  }

  async function loadSelected(code) {
    const [p, h] = await Promise.all([fetchPatient(code), fetchHistory(code)]);
    setPatient(p);
    setHistory(h);
    setNameDraft(p?.name || '');
  }

  useEffect(() => {
    if (!selectedCode) return;
    setReorderActiveIdx(null);
    loadSelected(selectedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode]);

  function unwatchedIdsFor(block) {
    return block.videoIds.filter((id) => !history.some((h) => h.video_id === id));
  }

  async function persistAndRefresh(patch, message) {
    await updatePatientQueueAndScheduled(selectedCode, patch);
    if (message) showBanner(message);
    await loadSelected(selectedCode);
  }

  async function handleBringForward(topicIdx) {
    const block = topicBlocks[topicIdx];
    const unwatched = unwatchedIdsFor(block);
    if (unwatched.length === 0) return;
    setReorderActiveIdx(null);
    await persistAndRefresh({ queue: [...patient.queue, ...unwatched] }, `"${block.topic}" moved to their next visit`);
  }

  async function handleReorderTiming(topicIdx, choice) {
    const block = topicBlocks[topicIdx];
    const unwatched = unwatchedIdsFor(block);
    if (unwatched.length === 0) return;
    const result = applyTimingChoice(choice, unwatched, block.topic, patient, library.coreSequence.length, history.length);
    setReorderActiveIdx(null);
    if (result.queueAdditions) {
      await persistAndRefresh({ queue: [...patient.queue, ...result.queueAdditions] }, `"${block.topic}" moved to their next visit`);
    } else {
      await persistAndRefresh(
        { scheduled: [...patient.scheduled, result.scheduledAddition] },
        `"${block.topic}" scheduled`
      );
    }
  }

  async function handleAddSeries(series, choice) {
    const videoIds = series.videos.map((v) => v.id);
    const result = applyTimingChoice(choice, videoIds, series.name, patient, library.coreSequence.length, history.length);
    if (result.queueAdditions) {
      await persistAndRefresh({ queue: [...patient.queue, ...result.queueAdditions] }, `"${series.name}" added to their next visit`);
    } else {
      await persistAndRefresh({ scheduled: [...patient.scheduled, result.scheduledAddition] }, `"${series.name}" scheduled`);
    }
  }

  async function handleRemoveQueued(idx) {
    await persistAndRefresh({ queue: patient.queue.filter((_, i) => i !== idx) });
  }
  async function handleRemoveScheduled(idx) {
    await persistAndRefresh({ scheduled: patient.scheduled.filter((_, i) => i !== idx) });
  }

  async function handleSaveName() {
    await updatePatientName(selectedCode, nameDraft.trim() || null);
    showBanner('Name saved');
    await loadSelected(selectedCode);
  }

  const remaining = patient ? remainingCountFor(patient, library.coreSequence.length) : 0;

  return (
    <div className="screen">
      <div className="screen-header-row">
        <button className="back-arrow-btn" onClick={onClose}>
          ←
        </button>
        <div className="header-title">Doctor View</div>
        <div style={{ width: 38 }}></div>
      </div>

      <div className="doctor-section-title">Select patient</div>
      <PatientSearch selectedCode={selectedCode} onSelect={setSelectedCode} />

      {patient && (
        <div style={{ width: '100%' }}>
          <div className={`banner good${banner ? ' show' : ''}`}>{banner}</div>

          <div className="patient-name-row">
            <input
              className="patient-name-input"
              type="text"
              placeholder="Patient name (optional)"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
            <button className="patient-name-save" onClick={handleSaveName}>
              Save
            </button>
          </div>

          <div className="doctor-section-title">Reorder — bring a topic forward</div>
          <div className="doctor-section-sub">Tap where they are and where you want to send them next.</div>
          <RoadmapBar
            topicBlocks={topicBlocks}
            corePosition={patient.core_position}
            coreSequenceLength={library.coreSequence.length}
            activeIdx={reorderActiveIdx}
            onSelectBlock={(idx) => setReorderActiveIdx(idx === reorderActiveIdx ? null : idx)}
          />
          {reorderActiveIdx !== null && (
            <ReorderPanel
              topic={topicBlocks[reorderActiveIdx].topic}
              unwatchedCount={unwatchedIdsFor(topicBlocks[reorderActiveIdx]).length}
              onBringForward={() => handleBringForward(reorderActiveIdx)}
              onTimingSelect={(choice) => handleReorderTiming(reorderActiveIdx, choice)}
            />
          )}

          <div className="doctor-section-title">Add series — specialty content</div>
          <div className="doctor-section-sub">Grouped by condition. Always asks when to insert.</div>
          <SeriesList specialtySeriesList={library.specialtySeriesList} onAddSeries={handleAddSeries} />

          <QueueScheduledLists
            queue={patient.queue}
            scheduled={patient.scheduled}
            library={library}
            onRemoveQueued={handleRemoveQueued}
            onRemoveScheduled={handleRemoveScheduled}
          />

          <div className="doctor-section-title">Full history</div>
          <div className="stat-row">
            <div className="stat-box">
              <div className="num">{history.length}</div>
              <div className="lbl">Watched</div>
            </div>
            <div className="stat-box">
              <div className="num">{remaining}</div>
              <div className="lbl">Remaining</div>
            </div>
          </div>
          <HistoryList history={history} library={library} emptyText="Nothing watched yet." />
        </div>
      )}
    </div>
  );
}
