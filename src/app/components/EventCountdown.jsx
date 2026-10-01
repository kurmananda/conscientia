'use client';

import { useEffect, useState } from 'react';

// Real countdown to the fest start (00:00 IST, 29 Oct 2026) — unlike
// EvergreenCountdown, this one actually expires.
const START = new Date('2026-10-29T00:00:00+05:30').getTime();

const pad = (n) => String(n).padStart(2, '0');

export default function EventCountdown({ className }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const tick = () => setRemaining(START - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  if (remaining <= 0) {
    return <div className={className}>Timefall is live</div>;
  }

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className={className}>
      <span className="font-mono tabular-nums">
        {days}d {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </span>{' '}
      <span className="text-white/40">left</span>
    </div>
  );
}
