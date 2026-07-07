import { useState } from 'react';
import NumericKeypad from './NumericKeypad';

export default function KeypadScreen({ onSubmitCode, error, onOpenDoctorPin }) {
  const [value, setValue] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  function handleComplete(code) {
    if (code.length !== 4) return;
    onSubmitCode(code, () => setValue(''));
  }

  return (
    <div className="screen centered">
      <div className="logo-row" style={{ alignSelf: 'center' }}>
        <div className="logo-dot"></div>
        <div className="logo-text">Practice Education</div>
      </div>
      <div className="prompt-title">Enter Your Code</div>
      <div className="prompt-sub">Use the 4-digit number from your card</div>

      <NumericKeypad value={value} onChange={setValue} length={4} onComplete={handleComplete} />

      <div className="error-msg">{error}</div>
      <button
        className="helper-link"
        onClick={() => {
          setShowForgot(true);
          setTimeout(() => setShowForgot(false), 3500);
        }}
      >
        Forgot your code?
      </button>
      <div className={`banner warn${showForgot ? ' show' : ''}`}>
        Please ask your CA to check the backup list for your code.
      </div>

      <div className="admin-toggle-row">
        <button className="admin-toggle" onClick={onOpenDoctorPin}>
          Doctor View
        </button>
      </div>
    </div>
  );
}
