import { useEffect, useState } from 'react';

export default function DoneScreen({ badgeInfo, onDone }) {
  const [count, setCount] = useState(5);

  useEffect(() => {
    setCount(5);
    const t = setInterval(() => setCount((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (count === 0) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div className="screen centered">
      {badgeInfo && (
        <div className="badge-banner show">
          <div className="badge-icon">🏅</div>
          <div className="badge-title">{badgeInfo.phase} Complete!</div>
          <div className="badge-sub">
            {badgeInfo.isFinalPhase ? "You've completed the full core series" : 'Great progress — on to the next stage'}
          </div>
        </div>
      )}
      <div className="checkmark-circle">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="#F26A21" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="prompt-title">All done!</div>
      <div className="prompt-sub">Please grab a slip from the stand</div>
      <div className="slip-box">
        <p>On your slip, write:</p>
        <span>
          1. The one biggest thing you learnt today
          <br />
          2. How you&apos;ll action this today
        </span>
      </div>
      <div className="prompt-sub" style={{ marginBottom: 0 }}>
        Leave it face-down on the lectern for your doctor
      </div>
      <div className="countdown-text">Returning to start in {count}...</div>
    </div>
  );
}
