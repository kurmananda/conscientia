'use client';

import { useEffect, useState } from 'react';

// Purely cosmetic urgency timer — no backend, no per-event deadline. Counts
// down a fixed 9-day window measured off the Unix epoch, then wraps back to
// 9 days automatically forever (`Date.now() % CYCLE_MS`), so it always shows
// "close to running out" without ever actually expiring or needing to be
// reset by anyone.
const CYCLE_MS = 9 * 24 * 60 * 60 * 1000;

function msRemaining() {
  return CYCLE_MS - (Date.now() % CYCLE_MS);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function EvergreenCountdown({ className, label = 'Offer ends in' }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    setRemaining(msRemaining());
    const id = setInterval(() => setRemaining(msRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className={className}>
      {label && (
        <span className="mr-1.5 text-white/40 uppercase tracking-[0.15em]">{label}</span>
      )}
      <span className="font-mono tabular-nums">
        {days}d {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
