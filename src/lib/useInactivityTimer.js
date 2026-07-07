import { useEffect, useRef } from 'react';

// Fires onTimeout after timeoutMs of no touch/click/key activity anywhere in
// the document. Used to recover the kiosk automatically when a patient is
// called into a room mid-video or simply walks off — no staff action needed.
export function useInactivityTimer(active, timeoutMs, onTimeout) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active || !timeoutMs) return undefined;

    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    };
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((ev) => document.addEventListener(ev, reset));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => document.removeEventListener(ev, reset));
    };
  }, [active, timeoutMs]);
}
