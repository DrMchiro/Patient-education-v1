import { useEffect, useState } from 'react';
import { searchPatients } from '../lib/api';

export default function PatientSearch({ selectedCode, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let cancelled = false;
    searchPatients(query).then((rows) => {
      if (!cancelled) setResults(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <>
      <input
        className="doctor-search-input"
        type="text"
        placeholder="Search by code or name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="doctor-patient-select">
        {results.map((p) => (
          <button
            key={p.code}
            className={`patient-chip${p.code === selectedCode ? ' active' : ''}`}
            onClick={() => onSelect(p.code)}
          >
            {p.name || p.code}
            {p.name && <span className="chip-name">{p.code}</span>}
          </button>
        ))}
        {results.length === 0 && <div className="empty-note">No patients match "{query}".</div>}
      </div>
    </>
  );
}
