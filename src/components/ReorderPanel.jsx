import { useState } from 'react';
import TimingPicker from './TimingPicker';

export default function ReorderPanel({ topic, unwatchedCount, onBringForward, onTimingSelect }) {
  const [showTiming, setShowTiming] = useState(false);

  return (
    <div className="reorder-panel">
      <div className="reorder-panel-title">{topic}</div>
      <div className="reorder-panel-sub">
        {unwatchedCount > 0
          ? `${unwatchedCount} video${unwatchedCount > 1 ? 's' : ''} remaining in this topic`
          : 'All videos in this topic are already watched'}
      </div>
      <div className="reorder-panel-actions">
        {unwatchedCount > 0 && (
          <button className="pill-btn primary" onClick={onBringForward}>
            Bring forward → next visit
          </button>
        )}
        <button className="pill-btn" onClick={() => setShowTiming((s) => !s)}>
          Not now ▾
        </button>
      </div>
      {showTiming && <TimingPicker onSelect={onTimingSelect} />}
    </div>
  );
}
