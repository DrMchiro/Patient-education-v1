import { useState } from 'react';
import TimingPicker from './TimingPicker';

function SeriesCard({ series, onTimingSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="series-card">
      <div className="series-card-top">
        <div className="series-name">{series.name}</div>
        <div className="series-count">{series.videos.length} videos</div>
      </div>
      <button className="series-add-btn" onClick={() => setOpen((o) => !o)}>
        Add to plan
      </button>
      {open && (
        <TimingPicker
          includeNextVisit
          onSelect={(choice) => {
            onTimingSelect(choice);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function SeriesList({ specialtySeriesList, onAddSeries }) {
  return (
    <div>
      {specialtySeriesList.map((series) => (
        <SeriesCard key={series.key} series={series} onTimingSelect={(choice) => onAddSeries(series, choice)} />
      ))}
    </div>
  );
}
