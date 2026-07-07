import { useState } from 'react';

const BASE_OPTIONS = [
  { key: 'Foundations', label: 'Foundations' },
  { key: 'Building', label: 'Building' },
  { key: 'Mastery', label: 'Mastery' },
  { key: 'end', label: 'At the end' },
  { key: 'custom', label: 'Custom' },
];

// Shared "when should this be inserted" picker used by both the reorder
// panel and the add-series cards. onSelect receives the same `choice` shape
// businessLogic.applyTimingChoice expects: 'next' | 'Foundations' | 'Building'
// | 'Mastery' | 'end' | { custom: visitsFromNow }.
export default function TimingPicker({ onSelect, includeNextVisit = false }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [customVisits, setCustomVisits] = useState(5);

  const options = includeNextVisit ? [{ key: 'next', label: 'Next visit' }, ...BASE_OPTIONS] : BASE_OPTIONS;

  function pick(opt) {
    setSelectedKey(opt.key);
    if (opt.key !== 'custom') onSelect(opt.key);
  }

  return (
    <div className="timing-picker">
      <div className="timing-btn-row">
        {options.map((opt) => (
          <button
            key={opt.key}
            className={`timing-btn${selectedKey === opt.key ? ' selected' : ''}`}
            onClick={() => pick(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selectedKey === 'custom' && (
        <div className="custom-visit-row">
          <span className="custom-visit-label">
            In {customVisits} visit{customVisits > 1 ? 's' : ''}
          </span>
          <input
            type="range"
            min="1"
            max="20"
            value={customVisits}
            onChange={(e) => setCustomVisits(Number(e.target.value))}
          />
        </div>
      )}
      {selectedKey === 'custom' && (
        <button className="pill-btn primary" style={{ marginTop: 10 }} onClick={() => onSelect({ custom: customVisits })}>
          Confirm timing
        </button>
      )}
    </div>
  );
}
