import { useState } from 'react';
import NumericKeypad from './NumericKeypad';

const STAFF_PIN = import.meta.env.VITE_STAFF_PIN || '1234';

export default function DoctorPinScreen({ onSuccess, onCancel }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleComplete(pin) {
    if (pin.length !== 4) return;
    if (pin === STAFF_PIN) {
      setValue('');
      setError('');
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setValue('');
    }
  }

  return (
    <div className="screen centered">
      <div className="prompt-title">Staff Access</div>
      <div className="prompt-sub">Enter your 4-digit staff PIN</div>
      <NumericKeypad value={value} onChange={setValue} length={4} mask onComplete={handleComplete} />
      <div className="error-msg">{error}</div>
      <button className="helper-link" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
