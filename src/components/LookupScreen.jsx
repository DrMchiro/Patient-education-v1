import { getLastForPatient, getNextForPatient, remainingCountFor } from '../lib/businessLogic';
import HistoryList from './HistoryList';

export default function LookupScreen({ code, patient, history, library, onStartVideo, onBackToStart }) {
  const last = getLastForPatient(history);
  const lastVideo = last ? library.byId.get(last.video_id) : null;
  const next = getNextForPatient(patient, library.coreSequence);
  const nextVideo = next ? library.byId.get(next.id) : null;
  const remaining = remainingCountFor(patient, library.coreSequence.length);

  return (
    <div className="screen">
      <div className="welcome-badge">{history.length === 0 ? 'WELCOME' : 'WELCOME BACK'}</div>
      <div className="patient-code-tag">Code {code}</div>

      {lastVideo && (
        <div className="video-card last">
          <div className="video-card-label">Last watched</div>
          <div className="video-card-title">{lastVideo.title}</div>
          <div className="video-card-topic">{lastVideo.topic}</div>
        </div>
      )}

      <div className="video-card next">
        {next?.fromQueue && <div className="doctor-added-badge">From your doctor</div>}
        {nextVideo ? (
          <>
            <div className="video-card-label">Up next</div>
            <div className="video-card-title">{nextVideo.title}</div>
            <div className="video-card-topic">{nextVideo.topic}</div>
          </>
        ) : (
          <>
            <div className="video-card-label">You're all caught up</div>
            <div className="video-card-title">All videos completed 🎉</div>
            <div className="video-card-topic">Ask your doctor about ongoing topics</div>
          </>
        )}
      </div>

      <div className="phase-track">
        {library.coreSequence.map((_, i) => (
          <div key={i} className={`phase-seg${i < patient.core_position ? ' filled' : ''}`}></div>
        ))}
      </div>
      <div className="phase-labels">
        <span>Foundations</span>
        <span>Building</span>
        <span>Mastery</span>
      </div>

      {nextVideo ? (
        <button className="big-button" onClick={onStartVideo}>
          Play Video
        </button>
      ) : (
        <button className="big-button secondary" onClick={onBackToStart}>
          Back to Start
        </button>
      )}

      <div className="divider-label">My learning so far</div>
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
      <HistoryList history={history} library={library} emptyText="Nothing watched yet — your first video will appear here." />
    </div>
  );
}
