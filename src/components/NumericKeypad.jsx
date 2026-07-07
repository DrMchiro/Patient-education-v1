import { useEffect } from 'react';

// Controlled numeric keypad shared by patient code entry and the staff PIN
// gate. Auto-submits ~150ms after the last digit, mirroring the prototype's
// feel (submit on completion, no separate "confirm" tap needed).
export default function NumericKeypad({ value, onChange, length, mask = false, onComplete }) {
  useEffect(() => {
    if (value.length !== length) return undefined;
    const t = setTimeout(() => onComplete(value), 150);
    return () => clearTimeout(t);
  }, [value, length, onComplete]);

  function press(d) {
    if (value.length >= length) return;
    onChange(value + d);
  }
  function clear() {
    onChange('');
  }

  const slots = Array.from({ length }, (_, i) => (value[i] ? (mask ? '●' : value[i]) : '_'));

  return (
    <>
      <div className="code-display" style={length > 3 ? { maxWidth: 340 } : undefined}>
        {slots.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
      <div className="keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button className="key clear" onClick={clear}>
          Clear
        </button>
        <button className="key" onClick={() => press('0')}>
          0
        </button>
        <button className="key action" onClick={() => onComplete(value)}>
          Go
        </button>
      </div>
    </>
  );
}
